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
import { Logger, UseGuards } from '@nestjs/common';
import { ConnectionManagerService } from './connection-manager.service';
import {
  WebSocketMessageDto,
  LocationUpdateMessageDto,
  WebSocketErrorMessageDto,
} from '../dto/websocket-message.dto';

@WebSocketGateway({
  namespace: '/riders',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class RiderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RiderGateway.name);

  constructor(private readonly connectionManager: ConnectionManagerService) {}

  /**
   * Handle new rider connection
   */
  async handleConnection(client: Socket) {

    this.logger.log(`New connection attempt from ${client.id}`);

    try {
      // Extract rider ID from handshake (query or headers)
      const riderId = this.extractRiderId(client);

      if (!riderId) {
        this.logger.warn('Connection rejected: No rider ID provided');
        this.sendError(client, 'AUTHENTICATION_FAILED', 'Rider ID is required');
        client.disconnect();
        return;
      }

      // Validate rider exists (you could add database validation here)
      if (!(await this.validateRider(riderId))) {
        this.logger.warn(`Connection rejected: Invalid rider ID ${riderId}`);
        this.sendError(client, 'INVALID_RIDER', 'Invalid rider ID');
        client.disconnect();
        return;
      }

      // Register the connection
      this.connectionManager.addRiderConnection(riderId, client);

      // Store rider ID in socket data for easy access
      client.data.riderId = riderId;

      // Send welcome message
      this.sendMessage(client, {
        type: 'connection_established',
        data: {
          riderId,
          message: 'Successfully connected to rider gateway',
          serverTime: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId(),
      });

      this.logger.log(`Rider ${riderId} connected to gateway`);
    } catch (error) {
      this.logger.error('Error handling connection', error);
      this.sendError(
        client,
        'CONNECTION_ERROR',
        'Failed to establish connection',
      );
      client.disconnect();
    }
  }

  /**
   * Handle rider disconnection
   */
  handleDisconnect(client: Socket) {
    const riderId = client.data.riderId;

    if (riderId) {
      this.connectionManager.removeRiderConnection(riderId);
      this.logger.log(`Rider ${riderId} disconnected from gateway`);
    } else {
      this.logger.log('Unknown client disconnected from gateway');
    }
  }

  /**
   * Handle location updates from riders
   */
  @SubscribeMessage('location_update')
  async handleLocationUpdate(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const riderId = client.data.riderId;

    if (!riderId) {
      this.sendError(
        client,
        'AUTHENTICATION_REQUIRED',
        'Rider not authenticated',
      );
      return;
    }

    try {
      // Validate location data
      if (!this.isValidLocationData(data)) {
        this.sendError(
          client,
          'INVALID_LOCATION_DATA',
          'Invalid location data',
        );
        return;
      }

      // Update rider activity timestamp
      this.connectionManager.updateRiderActivity(riderId);

      // Create location update message
      const locationMessage: LocationUpdateMessageDto = {
        type: 'location_update',
        data: {
          riderId,
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId(),
      };

      // Broadcast to dispatch dashboards
      this.connectionManager.broadcastLocationUpdate(locationMessage);
      this.logger.log(`LOCATION BROADCASTED: Rider ${riderId} at (${data.latitude}, ${data.longitude}) sent to dispatch dashboards`);

      // Acknowledge the update
      this.sendMessage(client, {
        type: 'location_update_acknowledged',
        data: {
          riderId,
          received: true,
          serverTime: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId(),
      });

      this.logger.debug(
        `Location updated for rider ${riderId}: (${data.latitude}, ${data.longitude})`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing location update for rider ${riderId}`,
        error,
      );
      this.sendError(
        client,
        'PROCESSING_ERROR',
        'Failed to process location update',
      );
    }
  }

  /**
   * Handle status updates from riders (online/offline)
   */
  @SubscribeMessage('status_update')
  async handleStatusUpdate(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const riderId = client.data.riderId;

    if (!riderId) {
      this.sendError(
        client,
        'AUTHENTICATION_REQUIRED',
        'Rider not authenticated',
      );
      return;
    }

    try {
      // Update rider activity
      this.connectionManager.updateRiderActivity(riderId);

      // Broadcast status to dispatch
      this.connectionManager.broadcastToDispatch({
        type: 'rider_status_update',
        data: {
          riderId,
          status: data.status,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId(),
      });

      // Acknowledge the update
      this.sendMessage(client, {
        type: 'status_update_acknowledged',
        data: {
          riderId,
          status: data.status,
          received: true,
        },
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId(),
      });

      this.logger.debug(`Status updated for rider ${riderId}: ${data.status}`);
    } catch (error) {
      this.logger.error(
        `Error processing status update for rider ${riderId}`,
        error,
      );
      this.sendError(
        client,
        'PROCESSING_ERROR',
        'Failed to process status update',
      );
    }
  }

  /**
   * Send message to a specific rider
   */
  sendToRider(riderId: number, message: WebSocketMessageDto): boolean {
    const result = this.connectionManager.sendToRider(riderId, message);
    
    if (result) {
      // Log the message being sent to the rider
      this.logger.log(`MESSAGE SENT TO RIDER ${riderId}: ${message.type}`);
      this.logger.debug(`Message content: ${JSON.stringify(message, null, 2)}`);
      
      // Special logging for different message types
      if (message.type === 'order_assignment') {
        this.logger.log(` ORDER ASSIGNED TO RIDER ${riderId}: Order #${message.data.order_id}`);
      } else if (message.type === 'dispatch_message') {
        this.logger.log(`DISPATCH MESSAGE TO RIDER ${riderId}: ${message.data.message || 'Custom message'}`);
      }
    } else {
      this.logger.warn(` FAILED TO SEND MESSAGE TO RIDER ${riderId}: Rider not connected`);
    }
    
    return result;
  }

  /**
   * Send error message to client
   */
  private sendError(client: Socket, code: string, message: string) {
    const errorMessage: WebSocketErrorMessageDto = {
      type: 'error',
      data: {
        code,
        message,
      },
      timestamp: new Date().toISOString(),
      messageId: this.generateMessageId(),
    };
    client.emit('error', errorMessage);
  }

  /**
   * Send regular message to client
   */
  private sendMessage(client: Socket, message: WebSocketMessageDto) {
    client.emit('message', message);
  }

  /**
   * Extract rider ID from socket connection
   */
  private extractRiderId(client: Socket): number | null {
    this.logger.debug(
      `Connection query params: ${JSON.stringify(client.handshake.query)}`,
    );
    this.logger.debug(
      `Connection headers: ${JSON.stringify(client.handshake.headers)}`,
    );

    // Try to get from query parameters
    const riderIdQuery = client.handshake.query.riderId;
    if (riderIdQuery) {
      const riderId = parseInt(riderIdQuery as string, 10);
      this.logger.debug(`Found riderId in query: ${riderId}`);
      return isNaN(riderId) ? null : riderId;
    }

    // Try to get from headers
    const riderIdHeader = client.handshake.headers['x-rider-id'];
    if (riderIdHeader) {
      const riderId = parseInt(riderIdHeader as string, 10);
      this.logger.debug(`Found riderId in headers: ${riderId}`);
      return isNaN(riderId) ? null : riderId;
    }

    this.logger.warn('No riderId found in query or headers');
    return null;
  }

  /**
   * Validate rider exists (mock implementation - replace with actual validation)
   */
  private async validateRider(riderId: number): Promise<boolean> {
    // TODO: Add actual database validation
    // For now, accept any positive integer as valid rider ID
    return riderId > 0;
  }

  /**
   * Validate location data structure
   */
  private isValidLocationData(data: any): boolean {
    return (
      data &&
      typeof data.latitude === 'number' &&
      typeof data.longitude === 'number' &&
      data.latitude >= -90 &&
      data.latitude <= 90 &&
      data.longitude >= -180 &&
      data.longitude <= 180
    );
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
