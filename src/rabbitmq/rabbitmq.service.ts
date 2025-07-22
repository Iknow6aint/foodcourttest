import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ORDER_QUEUE, MessageType } from './queue.constants';
import { rabbitMQConfig } from './rabbitmq.config';

export interface OrderMessage {
  type: MessageType;
  orderId: number;
  userId: number;
  orderData: Record<string, any>;
  timestamp: Date;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: any = null;
  private channel: any = null;
  private isConnected = false;
  private reconnectAttempts = 0;

  async onModuleInit() {
    // Don't throw error on connection failure, just keep trying in background
    this.connectWithRetry().catch((error) => {
      this.logger.warn('Initial RabbitMQ connection failed, will continue retrying in background');
    });
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connectWithRetry(): Promise<void> {
    while (this.reconnectAttempts < rabbitMQConfig.retryAttempts && !this.isConnected) {
      try {
        this.logger.log(`Attempting to connect to RabbitMQ (attempt ${this.reconnectAttempts + 1}/${rabbitMQConfig.retryAttempts})...`);
        
        const amqp = await import('amqplib');
        this.connection = await amqp.connect(rabbitMQConfig.uri);
        this.channel = await this.connection.createChannel();
        
        // Set up connection error handlers
        this.connection.on('error', (err: Error) => {
          this.logger.error('RabbitMQ connection error:', err.message);
          this.isConnected = false;
        });

        this.connection.on('close', () => {
          this.logger.warn('RabbitMQ connection closed');
          this.isConnected = false;
          this.scheduleReconnect();
        });

        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.logger.log('🐰 Successfully connected to RabbitMQ');
        
        // Setup queues and start listening after successful connection
        await this.setupQueues();
        await this.listenForOrderMessages();
        
      } catch (error: any) {
        this.reconnectAttempts++;
        this.logger.error(`Failed to connect to RabbitMQ (attempt ${this.reconnectAttempts}):`, error.message);
        
        if (this.reconnectAttempts < rabbitMQConfig.retryAttempts) {
          this.logger.log(`Retrying in ${rabbitMQConfig.retryDelay}ms...`);
          await this.delay(rabbitMQConfig.retryDelay);
        } else {
          this.logger.error('❌ Failed to connect to RabbitMQ after maximum retry attempts');
          throw new Error('Unable to establish RabbitMQ connection');
        }
      }
    }
  }

  private async setupQueues(): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    try {
      // Assert the main order queue
      await this.channel.assertQueue(ORDER_QUEUE, {
        durable: rabbitMQConfig.options.durable,
      });

      this.logger.log(`✅ Queue "${ORDER_QUEUE}" is ready`);
    } catch (error) {
      this.logger.error('Failed to setup queues:', error.message);
      throw error;
    }
  }

  private async listenForOrderMessages(): Promise<void> {
    if (!this.channel) {
      this.logger.error('Cannot start listening: RabbitMQ channel not initialized');
      return;
    }

    try {
      this.logger.log(`🎧 Starting to listen for messages on queue: ${ORDER_QUEUE}`);
      
      await this.channel.consume(ORDER_QUEUE, async (msg) => {
        if (msg !== null) {
          try {
            const messageContent = msg.content.toString();
            const orderMessage: OrderMessage = JSON.parse(messageContent);
            
            this.logger.log('📦 ===== NEW ORDER MESSAGE RECEIVED =====');
            this.logger.log(`📊 Message Type: ${orderMessage.type}`);
            this.logger.log(`🆔 Order ID: ${orderMessage.orderId}`);
            this.logger.log(`👤 User ID: ${orderMessage.userId}`);
            this.logger.log(`⏰ Timestamp: ${orderMessage.timestamp}`);
            this.logger.log(`📄 Order Data: ${JSON.stringify(orderMessage.orderData, null, 2)}`);
            this.logger.log('==========================================');

            // Process the order message
            await this.processOrderMessage(orderMessage);
            
            // Acknowledge the message
            this.channel?.ack(msg);
            this.logger.log(`✅ Message processed and acknowledged`);
            
          } catch (error) {
            this.logger.error('❌ Error processing message:', error.message);
            
            // Reject the message and don't requeue if it's a parsing error
            this.channel?.nack(msg, false, false);
          }
        }
      });
      
    } catch (error) {
      this.logger.error('Failed to start consuming messages:', error.message);
      throw error;
    }
  }

  private async processOrderMessage(orderMessage: OrderMessage): Promise<void> {
    try {
      switch (orderMessage.type) {
        case MessageType.ORDER_CREATED:
          this.logger.log(`🎉 Processing new order creation for Order #${orderMessage.orderId}`);
          // Add any specific business logic for order creation here
          break;
          
        case MessageType.ORDER_UPDATED:
          this.logger.log(`📝 Processing order update for Order #${orderMessage.orderId}`);
          // Add any specific business logic for order updates here
          break;
          
        case MessageType.ORDER_CANCELLED:
          this.logger.log(`❌ Processing order cancellation for Order #${orderMessage.orderId}`);
          // Add any specific business logic for order cancellation here
          break;
          
        default:
          this.logger.warn(`⚠️ Unknown message type: ${orderMessage.type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process order message:`, error.message);
      throw error;
    }
  }

  /**
   * Publish an order message to the queue
   */
  async publishOrderMessage(orderMessage: OrderMessage): Promise<void> {
    if (!this.isConnected || !this.channel) {
      this.logger.error('Cannot publish message: RabbitMQ not connected');
      throw new Error('RabbitMQ connection not available');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(orderMessage));
      
      const published = this.channel.sendToQueue(
        ORDER_QUEUE,
        messageBuffer,
        {
          persistent: rabbitMQConfig.options.persistent,
          timestamp: Date.now(),
        }
      );

      if (published) {
        this.logger.log(`📤 Message published to queue "${ORDER_QUEUE}": ${orderMessage.type} for Order #${orderMessage.orderId}`);
      } else {
        this.logger.error('Failed to publish message to queue');
        throw new Error('Failed to publish message to queue');
      }
      
    } catch (error) {
      this.logger.error('Error publishing message:', error.message);
      throw error;
    }
  }

  /**
   * Convenience method to publish order created message
   */
  async publishOrderCreated(orderId: number, userId: number, orderData: Record<string, any>): Promise<void> {
    const orderMessage: OrderMessage = {
      type: MessageType.ORDER_CREATED,
      orderId,
      userId,
      orderData,
      timestamp: new Date(),
    };

    await this.publishOrderMessage(orderMessage);
  }

  private scheduleReconnect(): void {
    if (!this.isConnected && this.reconnectAttempts < rabbitMQConfig.retryAttempts) {
      setTimeout(() => {
        this.logger.log('Attempting to reconnect to RabbitMQ...');
        this.connectWithRetry();
      }, rabbitMQConfig.retryDelay);
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      
      this.isConnected = false;
      this.logger.log('� Disconnected from RabbitMQ');
      
    } catch (error) {
      this.logger.error('Error during RabbitMQ disconnect:', error.message);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check method
   */
  getConnectionStatus(): { connected: boolean; attempts: number } {
    return {
      connected: this.isConnected,
      attempts: this.reconnectAttempts,
    };
  }
}
