import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { ORDER_QUEUE } from './queue.constants';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async onModuleInit() {
    await this.connect();
    await this.listenForOrderCreated();
  }

  private async connect() {
    try {
      this.connection = await amqp.connect('amqp://localhost');
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(ORDER_QUEUE, { durable: false });
      this.logger.log(`Connected to RabbitMQ and queue "${ORDER_QUEUE}"`);
    } catch (err) {
      this.logger.error('Failed to connect to RabbitMQ', err);
    }
  }

  async publishOrder(orderData: Record<string, any>) {
    if (!this.channel) throw new Error('RabbitMQ channel not initialized');
    this.channel.sendToQueue(
      ORDER_QUEUE,
      Buffer.from(JSON.stringify(orderData)),
    );
    this.logger.log(`Published order to queue: ${ORDER_QUEUE}`);
  }

  private async listenForOrderCreated() {
    this.channel.consume(ORDER_QUEUE, (msg) => {
      if (msg !== null) {
        const orderData = JSON.parse(msg.content.toString());
        this.logger.log(`📦 New Order Received: ${JSON.stringify(orderData)}`);
        this.channel.ack(msg);
      }
    });
  }
}
