import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import {
  WebSocketMessageDto,
  LocationUpdateMessageDto,
  ConnectionStatusMessageDto,
} from '../dto/websocket-message.dto';

interface ConnectedRider {
  riderId: number;
  socket: Socket;
  connectedAt: Date;
  lastActivity: Date;
}

interface ConnectedDispatch {
  id: string;
  socket: Socket;
  connectedAt: Date;
  lastActivity: Date;
}

@Injectable()
export class ConnectionManagerService {
  private readonly logger = new Logger(ConnectionManagerService.name);

  // Map to store rider connections: riderId -> connection details
  private riderConnections = new Map<number, ConnectedRider>();

  // Map to store dispatch connections: sessionId -> connection details
  private dispatchConnections = new Map<string, ConnectedDispatch>();

  /**
   * Register a new rider connection
   */
  addRiderConnection(riderId: number, socket: Socket): void {
    const connection: ConnectedRider = {
      riderId,
      socket,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    // Remove existing connection if any
    this.removeRiderConnection(riderId);

    // Add new connection
    this.riderConnections.set(riderId, connection);

    this.logger.log(
      `Rider ${riderId} connected. Active connections: ${this.riderConnections.size}`,
    );

    // Notify dispatch dashboards about new rider connection
    this.broadcastToDispatch({
      type: 'rider_connected',
      data: {
        riderId,
        status: 'connected',
        connectedAt: connection.connectedAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
      messageId: this.generateMessageId(),
    });
  }

  /**
   * Register a new dispatch connection
   */
  addDispatchConnection(sessionId: string, socket: Socket): void {
    const connection: ConnectedDispatch = {
      id: sessionId,
      socket,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    this.dispatchConnections.set(sessionId, connection);

    this.logger.log(
      `Dispatch ${sessionId} connected. Active dispatchers: ${this.dispatchConnections.size}`,
    );

    // Send current connected riders to the new dispatch connection
    this.sendConnectedRidersToDispatch(socket);
  }

  /**
   * Remove rider connection
   */
  removeRiderConnection(riderId: number): boolean {
    const connection = this.riderConnections.get(riderId);
    if (connection) {
      this.riderConnections.delete(riderId);

      this.logger.log(
        `Rider ${riderId} disconnected. Active connections: ${this.riderConnections.size}`,
      );

      // Notify dispatch dashboards about rider disconnection
      this.broadcastToDispatch({
        type: 'rider_disconnected',
        data: {
          riderId,
          status: 'disconnected',
          disconnectedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId(),
      });

      return true;
    }
    return false;
  }

  /**
   * Remove dispatch connection
   */
  removeDispatchConnection(sessionId: string): boolean {
    const connection = this.dispatchConnections.get(sessionId);
    if (connection) {
      this.dispatchConnections.delete(sessionId);

      this.logger.log(
        `Dispatch ${sessionId} disconnected. Active dispatchers: ${this.dispatchConnections.size}`,
      );

      return true;
    }
    return false;
  }

  /**
   * Send message to a specific rider
   */
  sendToRider(riderId: number, message: WebSocketMessageDto): boolean {
    const connection = this.riderConnections.get(riderId);
    if (connection && connection.socket.connected) {
      connection.socket.emit('message', message);
      connection.lastActivity = new Date();

      this.logger.debug(`Message sent to rider ${riderId}: ${message.type}`);
      return true;
    }

    this.logger.warn(
      `Failed to send message to rider ${riderId}: Not connected`,
    );
    return false;
  }

  /**
   * Broadcast message to all connected dispatch dashboards
   */
  broadcastToDispatch(message: WebSocketMessageDto): void {
    let sentCount = 0;

    this.dispatchConnections.forEach((connection, sessionId) => {
      if (connection.socket.connected) {
        connection.socket.emit('message', message);
        connection.lastActivity = new Date();
        sentCount++;
      } else {
        // Clean up disconnected sockets
        this.dispatchConnections.delete(sessionId);
      }
    });

    if (sentCount > 0) {
      this.logger.debug(
        `Message broadcasted to ${sentCount} dispatch connections: ${message.type}`,
      );

      // Special logging for location updates
      if (message.type === 'location_update') {
        this.logger.log(
          ` LOCATION UPDATE SENT TO DISPATCH: Rider ${message.data?.riderId} → ${sentCount} dashboard(s)`,
        );
      } else if (message.type === 'order_assigned') {
        this.logger.log(
          `ORDER ASSIGNMENT NOTIFICATION SENT TO DISPATCH: Order ${message.data?.order_id} assigned to Rider ${message.data?.rider_id} → ${sentCount} dashboard(s)`,
        );
      }
    } else {
      this.logger.warn(
        `No dispatch connections available to receive message: ${message.type}`,
      );
    }
  }

  /**
   * Broadcast location update to dispatch dashboards
   */
  broadcastLocationUpdate(locationData: LocationUpdateMessageDto): void {
    this.broadcastToDispatch(locationData);
  }

  /**
   * Get rider connection status
   */
  isRiderConnected(riderId: number): boolean {
    const connection = this.riderConnections.get(riderId);
    return connection !== undefined && connection.socket.connected;
  }

  /**
   * Get all connected rider IDs
   */
  getConnectedRiderIds(): number[] {
    return Array.from(this.riderConnections.keys());
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    connectedRiders: number;
    connectedDispatchers: number;
    totalConnections: number;
  } {
    return {
      connectedRiders: this.riderConnections.size,
      connectedDispatchers: this.dispatchConnections.size,
      totalConnections:
        this.riderConnections.size + this.dispatchConnections.size,
    };
  }

  /**
   * Send current connected riders to a dispatch connection
   */
  private sendConnectedRidersToDispatch(dispatchSocket: Socket): void {
    const connectedRiders = Array.from(this.riderConnections.values()).map(
      (connection) => ({
        riderId: connection.riderId,
        connectedAt: connection.connectedAt.toISOString(),
        lastActivity: connection.lastActivity.toISOString(),
      }),
    );

    dispatchSocket.emit('message', {
      type: 'connected_riders_list',
      data: { riders: connectedRiders },
      timestamp: new Date().toISOString(),
      messageId: this.generateMessageId(),
    });
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Cleanup disconnected sockets periodically
   */
  cleanupDisconnectedSockets(): void {
    let cleanedUp = 0;

    // Cleanup rider connections
    this.riderConnections.forEach((connection, riderId) => {
      if (!connection.socket.connected) {
        this.riderConnections.delete(riderId);
        cleanedUp++;
      }
    });

    // Cleanup dispatch connections
    this.dispatchConnections.forEach((connection, sessionId) => {
      if (!connection.socket.connected) {
        this.dispatchConnections.delete(sessionId);
        cleanedUp++;
      }
    });

    if (cleanedUp > 0) {
      this.logger.log(`Cleaned up ${cleanedUp} disconnected sockets`);
    }
  }

  /**
   * Update rider activity timestamp
   */
  updateRiderActivity(riderId: number): void {
    const connection = this.riderConnections.get(riderId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }

  /**
   * Update dispatch activity timestamp
   */
  updateDispatchActivity(sessionId: string): void {
    const connection = this.dispatchConnections.get(sessionId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }
}
