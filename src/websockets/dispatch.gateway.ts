import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConnectionManagerService } from './connection-manager.service';
import { WebSocketMessageDto } from '../dto/websocket-message.dto';

@WebSocketGateway({
  namespace: '/dispatch',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class DispatchGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DispatchGateway.name);

  constructor(private readonly connectionManager: ConnectionManagerService) {}

  /**
   * Handle new dispatch dashboard connection
   */
  async handleConnection(client: Socket) {
    try {
      // Generate unique session ID for dispatch connection
      const sessionId = this.generateSessionId();

      // Register the dispatch connection
      this.connectionManager.addDispatchConnection(sessionId, client);

      // Store session ID in socket data
      client.data.sessionId = sessionId;

      // Send welcome message with connection stats
      const stats = this.connectionManager.getConnectionStats();
      client.emit('message', {
        type: 'dispatch_connected',
        data: {
          sessionId,
          message: 'Successfully connected to dispatch gateway',
          connectionStats: stats,
          connectedRiders: this.connectionManager.getConnectedRiderIds(),
          serverTime: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId(),
      });

      this.logger.log(`Dispatch dashboard ${sessionId} connected`);
    } catch (error) {
      this.logger.error('Error handling dispatch connection', error);
      client.disconnect();
    }
  }

  /**
   * Handle dispatch dashboard disconnection
   */
  handleDisconnect(client: Socket) {
    const sessionId = client.data.sessionId;

    if (sessionId) {
      this.connectionManager.removeDispatchConnection(sessionId);
      this.logger.log(`Dispatch dashboard ${sessionId} disconnected`);
    } else {
      this.logger.log('Unknown dispatch client disconnected');
    }
  }

  /**
   * Handle request for rider list
   */
  @SubscribeMessage('get_rider_list')
  async handleGetRiderList(@ConnectedSocket() client: Socket) {
    const sessionId = client.data.sessionId;

    if (!sessionId) {
      this.logger.warn('Unauthenticated dispatch client requesting rider list');
      return;
    }

    try {
      // Update activity timestamp
      this.connectionManager.updateDispatchActivity(sessionId);

      const connectedRiders = this.connectionManager.getConnectedRiderIds();
      const stats = this.connectionManager.getConnectionStats();

      client.emit('message', {
        type: 'rider_list',
        data: {
          connectedRiders,
          connectionStats: stats,
          requestedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId(),
      });

      this.logger.debug(`Sent rider list to dispatch ${sessionId}`);
    } catch (error) {
      this.logger.error('Error handling rider list request', error);
      client.emit('error', {
        type: 'error',
        data: {
          code: 'REQUEST_FAILED',
          message: 'Failed to retrieve rider list',
        },
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId(),
      });
    }
  }

  /**
   * Handle request for connection statistics
   */
  @SubscribeMessage('get_stats')
  async handleGetStats(@ConnectedSocket() client: Socket) {
    const sessionId = client.data.sessionId;

    if (!sessionId) {
      this.logger.warn('Unauthenticated dispatch client requesting stats');
      return;
    }

    try {
      // Update activity timestamp
      this.connectionManager.updateDispatchActivity(sessionId);

      const stats = this.connectionManager.getConnectionStats();

      client.emit('message', {
        type: 'connection_stats',
        data: {
          ...stats,
          requestedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId(),
      });

      this.logger.debug(`Sent connection stats to dispatch ${sessionId}`);
    } catch (error) {
      this.logger.error('Error handling stats request', error);
    }
  }

  /**
   * Handle sending message to specific rider
   */
  @SubscribeMessage('send_to_rider')
  async handleSendToRider(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const sessionId = client.data.sessionId;

    if (!sessionId) {
      this.logger.warn(
        'Unauthenticated dispatch client trying to send message',
      );
      return;
    }

    try {
      const { riderId, message } = data;

      if (!riderId || !message) {
        client.emit('error', {
          type: 'error',
          data: {
            code: 'INVALID_REQUEST',
            message: 'Both riderId and message are required',
          },
          timestamp: new Date().toISOString(),
          messageId: this.generateMessageId(),
        });
        return;
      }

      // Update activity timestamp
      this.connectionManager.updateDispatchActivity(sessionId);

      // Send message to rider
      const sent = this.connectionManager.sendToRider(riderId, {
        type: 'dispatch_message',
        data: {
          from: 'dispatch',
          message,
          dispatchSession: sessionId,
        },
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId(),
      });

      // Acknowledge to dispatch
      client.emit('message', {
        type: 'message_sent_result',
        data: {
          riderId,
          sent,
          message: sent
            ? 'Message sent successfully'
            : 'Rider not connected or message failed',
        },
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId(),
      });

      this.logger.debug(
        `Dispatch ${sessionId} sent message to rider ${riderId}: ${sent ? 'success' : 'failed'}`,
      );
    } catch (error) {
      this.logger.error('Error handling send to rider request', error);
      client.emit('error', {
        type: 'error',
        data: {
          code: 'SEND_FAILED',
          message: 'Failed to send message to rider',
        },
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId(),
      });
    }
  }

  /**
   * Broadcast message to all dispatch dashboards
   */
  broadcastToAllDispatch(message: WebSocketMessageDto): void {
    this.connectionManager.broadcastToDispatch(message);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `dispatch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
