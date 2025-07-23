import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConnectionManagerService } from '../../websockets/connection-manager.service';
import { KnexService } from '../../database/knex.service';
import { OrderAssignmentDto } from '../../models/dto/rider.dto';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    private readonly connectionManager: ConnectionManagerService,
    private readonly knex: KnexService,
  ) {}

  /**
   * Assign order to rider and broadcast via WebSocket
   */
  async assignOrderToRider(riderId: number, orderData: OrderAssignmentDto) {
    const knexInstance = this.knex.getKnex();

    // Verify rider exists
    const rider = await knexInstance('riders').where({ id: riderId }).first();
    if (!rider) {
      throw new NotFoundException(`Rider with ID ${riderId} not found`);
    }

    // Check if rider is available
    if (!rider.is_available) {
      this.logger.warn(`Attempting to assign order to unavailable rider ${riderId}`);
    }

    const result = await knexInstance.transaction(async (trx) => {
      // Check if order exists
      const existingOrder = await trx('orders').where({ id: orderData.order_id }).first();
      
      if (existingOrder) {
        // Update existing order with rider assignment
        await trx('orders')
          .where({ id: orderData.order_id })
          .update({
            rider_id: riderId,
            rider_assigned: true,
            updated_at: new Date(),
          });
      } else {
        // Create new order with minimal required fields
        await trx('orders').insert({
          id: orderData.order_id,
          user_id: 1, // Default user ID - this should come from the order data
          completed: false,
          cancelled: false,
          kitchen_cancelled: false,
          kitchen_accepted: false,
          kitchen_dispatched: false,
          kitchen_prepared: false,
          rider_assigned: true,
          paid: false,
          order_code: `ORDER-${orderData.order_id}`,
          rider_id: riderId,
          shop_accepted: false,
          shop_prepared: false,
          no_of_mealbags_delivered: 0,
          no_of_drinks_delivered: 0,
          rider_started: false,
          rider_arrived: false,
          is_failed_trip: false,
          scheduled: false,
          is_hidden: false,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      // Log the assignment
      await trx('logs').insert({
        order_id: orderData.order_id,
        description: `Order assigned to rider ${riderId} by dispatch`,
        time: new Date(),
      });

      return {
        assignmentId: orderData.order_id,
        riderId,
        orderData,
        assignedAt: new Date(),
      };
    });

    // Broadcast assignment via WebSocket
    const assignmentMessage = {
      type: 'order_assignment',
      rider_id: riderId,
      order_id: orderData.order_id,
      order_description: orderData.order_description,
      customer_name: orderData.customer_name,
      delivery_address: orderData.delivery_address,
      priority: orderData.priority || 'normal',
      assigned_at: new Date(),
    };

    // Send to specific rider
    const messageSent = this.connectionManager.sendToRider(riderId, assignmentMessage);

    this.logger.log(` BROADCASTING ORDER ASSIGNMENT:`);
    this.logger.log(`   → Rider ID: ${riderId}`);
    this.logger.log(`   → Order ID: ${orderData.order_id}`);
    this.logger.log(`   → Description: ${orderData.order_description}`);
    this.logger.log(`   → Message Delivered: ${messageSent ? '✅ YES' : '❌ NO (rider offline)'}`);

    // Broadcast to all dispatch clients for dashboard updates
    this.connectionManager.broadcastToDispatch({
      type: 'order_assigned',
      data: {
        rider_id: riderId,
        order_id: orderData.order_id,
        assigned_at: new Date(),
        delivery_success: messageSent,
      },
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Order ${orderData.order_id} assigned to rider ${riderId} and broadcasted`,
    );

    return result;
  }

  /**
   * Get all connected riders
   */
  async getConnectedRiders() {
    const connectedRiderIds = this.connectionManager.getConnectedRiderIds();
    const knexInstance = this.knex.getKnex();

    if (connectedRiderIds.length === 0) {
      return [];
    }

    // Get rider details from database
    const riders = await knexInstance('riders')
      .whereIn('id', connectedRiderIds)
      .select('id', 'name', 'is_available', 'vehicle_type', 'current_latitude', 'current_longitude');

    return riders.map(rider => ({
      ...rider,
      isConnected: true,
      connectionStatus: 'online',
    }));
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    const knexInstance = this.knex.getKnex();
    const connectedRiderIds = this.connectionManager.getConnectedRiderIds();
    const connectedStats = this.connectionManager.getConnectionStats();

    // Get various statistics
    const [
      totalRiders,
      availableRiders,
      totalOrders,
      assignedOrders,
      completedOrders,
    ] = await Promise.all([
      knexInstance('riders').count('* as count').first(),
      knexInstance('riders').where('is_available', true).count('* as count').first(),
      knexInstance('orders').count('* as count').first(),
      knexInstance('orders').where('rider_assigned', true).count('* as count').first(),
      knexInstance('orders').where('completed', true).count('* as count').first(),
    ]);

    return {
      connections: {
        riders: connectedRiderIds.length,
        dispatch: connectedStats.connectedDispatchers,
        total: connectedStats.totalConnections,
      },
      riders: {
        total: totalRiders ? parseInt(totalRiders.count as string) : 0,
        available: availableRiders ? parseInt(availableRiders.count as string) : 0,
        connected: connectedRiderIds.length,
      },
      orders: {
        total: totalOrders ? parseInt(totalOrders.count as string) : 0,
        assigned: assignedOrders ? parseInt(assignedOrders.count as string) : 0,
        completed: completedOrders ? parseInt(completedOrders.count as string) : 0,
      },
      timestamp: new Date(),
    };
  }
}
