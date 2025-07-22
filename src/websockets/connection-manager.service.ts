import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import {
  WebSocketMessageDto,
  LocationUpdateMessageDto,
  ConnectionStatusMessageDto,
} from '../models/dto/websocket-message.dto';

/**
 * Interface representing a connected rider
 * @interface ConnectedRider
 */
interface ConnectedRider {
  /** The unique identifier of the rider */
  riderId: number;
  /** The Socket.IO connection object */
  socket: Socket;
  /** Timestamp when the rider connected */
  connectedAt: Date;
  /** Timestamp of the rider's last activity */
  lastActivity: Date;
}

/**
 * Interface representing a connected dispatch dashboard
 * @interface ConnectedDispatch
 */
interface ConnectedDispatch {
  /** The unique session identifier for the dispatch connection */
  id: string;
  /** The Socket.IO connection object */
  socket: Socket;
  /** Timestamp when the dispatch connected */
  connectedAt: Date;
  /** Timestamp of the dispatch's last activity */
  lastActivity: Date;
}

/**
 * Service for managing WebSocket connections between riders and dispatch dashboards.
 * Handles connection tracking, message broadcasting, and real-time communication.
 *
 * @class ConnectionManagerService
 * @example
 * ```typescript
 * // Register a new rider connection
 * connectionManager.addRiderConnection(riderId, socket);
 *
 * // Send message to specific rider
 * connectionManager.sendToRider(riderId, message);
 *
 * // Broadcast to all dispatch dashboards
 * connectionManager.broadcastToDispatch(message);
 * ```
 */
@Injectable()
export class ConnectionManagerService {
  private readonly logger = new Logger(ConnectionManagerService.name);

  /** Map to store rider connections: riderId -> connection details */
  private riderConnections = new Map<number, ConnectedRider>();

  /** Map to store dispatch connections: sessionId -> connection details */
  private dispatchConnections = new Map<string, ConnectedDispatch>();

  /**
   * Register a new rider connection and notify dispatch dashboards.
   * Removes any existing connection for the same rider before adding the new one.
   *
   * @param {number} riderId - The unique identifier of the rider
   * @param {Socket} socket - The Socket.IO connection object
   * @returns {void}
   *
   * @example
   * ```typescript
   * connectionManager.addRiderConnection(123, socket);
   * ```
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
   * Register a new dispatch dashboard connection and send current rider list.
   *
   * @param {string} sessionId - The unique session identifier for the dispatch connection
   * @param {Socket} socket - The Socket.IO connection object
   * @returns {void}
   *
   * @example
   * ```typescript
   * connectionManager.addDispatchConnection('dispatch-123', socket);
   * ```
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
   * Remove rider connection and notify dispatch dashboards of disconnection.
   *
   * @param {number} riderId - The unique identifier of the rider to remove
   * @returns {boolean} True if the connection was found and removed, false otherwise
   *
   * @example
   * ```typescript
   * const removed = connectionManager.removeRiderConnection(123);
   * console.log(removed); // true if rider was connected
   * ```
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
   * Remove dispatch dashboard connection.
   *
   * @param {string} sessionId - The unique session identifier of the dispatch to remove
   * @returns {boolean} True if the connection was found and removed, false otherwise
   *
   * @example
   * ```typescript
   * const removed = connectionManager.removeDispatchConnection('dispatch-123');
   * console.log(removed); // true if dispatch was connected
   * ```
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
   * Send a message to a specific rider if they are connected.
   *
   * @param {number} riderId - The unique identifier of the rider
   * @param {WebSocketMessageDto} message - The message to send
   * @returns {boolean} True if the message was sent successfully, false if rider is not connected
   *
   * @example
   * ```typescript
   * const sent = connectionManager.sendToRider(123, {
   *   type: 'order_assigned',
   *   data: { orderId: 456 },
   *   timestamp: new Date().toISOString()
   * });
   * ```
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
   * Broadcast a message to all connected dispatch dashboards.
   * Automatically cleans up disconnected sockets during the broadcast.
   *
   * @param {WebSocketMessageDto} message - The message to broadcast
   * @returns {void}
   *
   * @example
   * ```typescript
   * connectionManager.broadcastToDispatch({
   *   type: 'rider_connected',
   *   data: { riderId: 123, status: 'connected' },
   *   timestamp: new Date().toISOString()
   * });
   * ```
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
          ` LOCATION UPDATE SENT TO DISPATCH: Rider ${(message.data as any)?.riderId} → ${sentCount} dashboard(s)`,
        );
      } else if (message.type === 'order_assigned') {
        this.logger.log(
          `ORDER ASSIGNMENT NOTIFICATION SENT TO DISPATCH: Order ${(message.data as any)?.order_id} assigned to Rider ${(message.data as any)?.rider_id} → ${sentCount} dashboard(s)`,
        );
      }
    } else {
      this.logger.warn(
        `No dispatch connections available to receive message: ${message.type}`,
      );
    }
  }

  /**
   * Broadcast location update message to all dispatch dashboards.
   * This is a convenience method that wraps broadcastToDispatch for location updates.
   *
   * @param {LocationUpdateMessageDto} locationData - The location update message to broadcast
   * @returns {void}
   *
   * @example
   * ```typescript
   * connectionManager.broadcastLocationUpdate({
   *   type: 'location_update',
   *   data: { riderId: 123, latitude: 37.7749, longitude: -122.4194 }
   * });
   * ```
   */
  broadcastLocationUpdate(locationData: LocationUpdateMessageDto): void {
    this.broadcastToDispatch(locationData);
  }

  /**
   * Check if a specific rider is currently connected.
   *
   * @param {number} riderId - The unique identifier of the rider
   * @returns {boolean} True if the rider is connected and socket is active, false otherwise
   *
   * @example
   * ```typescript
   * if (connectionManager.isRiderConnected(123)) {
   *   console.log('Rider 123 is online');
   * }
   * ```
   */
  isRiderConnected(riderId: number): boolean {
    const connection = this.riderConnections.get(riderId);
    return connection !== undefined && connection.socket.connected;
  }

  /**
   * Get an array of all currently connected rider IDs.
   *
   * @returns {number[]} Array of rider IDs that are currently connected
   *
   * @example
   * ```typescript
   * const connectedRiders = connectionManager.getConnectedRiderIds();
   * console.log(`${connectedRiders.length} riders are online`);
   * ```
   */
  getConnectedRiderIds(): number[] {
    return Array.from(this.riderConnections.keys());
  }

  /**
   * Get comprehensive connection statistics for monitoring and debugging.
   *
   * @returns {Object} Connection statistics object
   * @returns {number} returns.connectedRiders - Number of connected riders
   * @returns {number} returns.connectedDispatchers - Number of connected dispatch dashboards
   * @returns {number} returns.totalConnections - Total number of connections
   *
   * @example
   * ```typescript
   * const stats = connectionManager.getConnectionStats();
   * console.log(`Riders: ${stats.connectedRiders}, Dispatchers: ${stats.connectedDispatchers}`);
   * ```
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
   * Send the current list of connected riders to a newly connected dispatch dashboard.
   * This is automatically called when a new dispatch connection is established.
   *
   * @private
   * @param {Socket} dispatchSocket - The Socket.IO connection of the dispatch dashboard
   * @returns {void}
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
   * Generate a unique message ID for WebSocket messages.
   * Format: msg-{timestamp}-{random-string}
   *
   * @private
   * @returns {string} A unique message identifier
   *
   * @example
   * ```typescript
   * const messageId = this.generateMessageId();
   * // Returns: "msg-1642781234567-abc123"
   * ```
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Clean up disconnected sockets from both rider and dispatch connection maps.
   * This method should be called periodically to prevent memory leaks from stale connections.
   *
   * @returns {void}
   *
   * @example
   * ```typescript
   * // Call this method periodically (e.g., every 30 seconds)
   * setInterval(() => {
   *   connectionManager.cleanupDisconnectedSockets();
   * }, 30000);
   * ```
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
   * Update the last activity timestamp for a specific rider connection.
   * This helps track rider engagement and can be used for timeout mechanisms.
   *
   * @param {number} riderId - The unique identifier of the rider
   * @returns {void}
   *
   * @example
   * ```typescript
   * // Called when rider sends a message or performs an action
   * connectionManager.updateRiderActivity(123);
   * ```
   */
  updateRiderActivity(riderId: number): void {
    const connection = this.riderConnections.get(riderId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }

  /**
   * Update the last activity timestamp for a specific dispatch dashboard connection.
   * This helps track dashboard engagement and can be used for timeout mechanisms.
   *
   * @param {string} sessionId - The unique session identifier of the dispatch dashboard
   * @returns {void}
   *
   * @example
   * ```typescript
   * // Called when dispatch dashboard sends a request or performs an action
   * connectionManager.updateDispatchActivity('dispatch-123');
   * ```
   */
  updateDispatchActivity(sessionId: string): void {
    const connection = this.dispatchConnections.get(sessionId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }
}
