import { Injectable, Logger } from '@nestjs/common';
import { KnexService } from '../database/knex.service';
import { ProximityService, Location, NearbyRider } from './proximity.service';
import { ConnectionManagerService } from '../websockets/connection-manager.service';
import { Rider } from '../models/rider.model';
import { CalculatedOrder } from '../models/calculated-order.model';

/**
 * Interface for order location data
 */
export interface OrderLocation {
  orderId: number;
  restaurantLocation: Location;
  deliveryLocation?: Location;
  orderData?: any;
}

/**
 * Interface for proximity search result
 */
export interface ProximitySearchResult {
  orderId: number;
  restaurantLocation: Location;
  nearbyRiders: NearbyRider[];
  searchRadius: number;
  totalRidersFound: number;
  connectedRidersCount: number;
}

/**
 * Service for finding nearby riders when orders are created
 */
@Injectable()
export class OrderProximityService {
  private readonly logger = new Logger(OrderProximityService.name);
  private readonly DEFAULT_SEARCH_RADIUS = 5; // 5km default radius

  constructor(
    private readonly knex: KnexService,
    private readonly proximityService: ProximityService,
    private readonly connectionManager: ConnectionManagerService,
  ) {}

  /**
   * Find available riders within radius of restaurant location
   * @param restaurantLocation Restaurant coordinates
   * @param radiusKm Search radius in kilometers (default: 5km)
   * @returns Array of nearby available riders
   */
  async findNearbyRiders(
    restaurantLocation: Location,
    radiusKm: number = this.DEFAULT_SEARCH_RADIUS,
  ): Promise<NearbyRider[]> {
    this.logger.log(
      `🔍 SEARCHING FOR RIDERS within ${radiusKm}km of restaurant ` +
        `(${restaurantLocation.latitude}, ${restaurantLocation.longitude})`,
    );

    // Validate restaurant location
    if (!this.proximityService.validateLocation(restaurantLocation)) {
      this.logger.error('Invalid restaurant location coordinates');
      return [];
    }

    const knexInstance = this.knex.getKnex();

    try {
      // Get bounding box for efficient database query
      const boundingBox = this.proximityService.getBoundingBox(
        restaurantLocation,
        radiusKm,
      );

      // Query database for available riders within bounding box
      const availableRiders = await knexInstance('riders')
        .select([
          'id',
          'name',
          'phone',
          'email',
          'current_latitude',
          'current_longitude',
          'is_available',
          'last_location_update',
        ])
        .where('is_available', true)
        .where('is_active', true)
        .whereNotNull('current_latitude')
        .whereNotNull('current_longitude')
        .whereBetween('current_latitude', [
          boundingBox.minLat,
          boundingBox.maxLat,
        ])
        .whereBetween('current_longitude', [
          boundingBox.minLng,
          boundingBox.maxLng,
        ]);

      this.logger.debug(
        `Found ${availableRiders.length} available riders in bounding box`,
      );

      // Calculate precise distances and filter by radius
      const ridersWithDistance = availableRiders
        .map((rider) => ({
          id: rider.id,
          name: rider.name,
          phone: rider.phone,
          email: rider.email,
          current_latitude: rider.current_latitude,
          current_longitude: rider.current_longitude,
          is_available: rider.is_available,
          last_location_update: rider.last_location_update,
          distance_km: this.proximityService.calculateDistance(
            restaurantLocation,
            {
              latitude: rider.current_latitude,
              longitude: rider.current_longitude,
            },
          ),
        }))
        .filter((rider) => rider.distance_km <= radiusKm)
        .sort((a, b) => a.distance_km - b.distance_km);

      this.logger.log(
        `📍 PROXIMITY SEARCH RESULTS:\n` +
          `   → Riders in ${radiusKm}km radius: ${ridersWithDistance.length}\n` +
          `   → Restaurant: (${restaurantLocation.latitude}, ${restaurantLocation.longitude})\n` +
          `   → Closest rider: ${
            ridersWithDistance.length > 0
              ? `${ridersWithDistance[0].name} at ${ridersWithDistance[0].distance_km}km`
              : 'None found'
          }`,
      );

      // Log details of each nearby rider
      ridersWithDistance.forEach((rider, index) => {
        const isConnected = this.connectionManager.isRiderConnected(rider.id);
        this.logger.debug(
          `   ${index + 1}. ${rider.name} (ID: ${rider.id}) - ` +
            `${rider.distance_km}km away - ${isConnected ? '🟢 Online' : '🔴 Offline'}`,
        );
      });

      return ridersWithDistance;
    } catch (error) {
      this.logger.error('Error finding nearby riders:', error);
      return [];
    }
  }

  /**
   * Perform proximity search when order is created
   * @param orderLocation Order location data
   * @returns Proximity search results
   */
  async performOrderProximitySearch(
    orderLocation: OrderLocation,
  ): Promise<ProximitySearchResult> {
    const startTime = Date.now();

    this.logger.log(
      `🚀 STARTING PROXIMITY SEARCH for Order #${orderLocation.orderId}`,
    );

    const nearbyRiders = await this.findNearbyRiders(
      orderLocation.restaurantLocation,
      this.DEFAULT_SEARCH_RADIUS,
    );

    // Get connection status for each rider
    const connectedRiders = nearbyRiders.filter((rider) =>
      this.connectionManager.isRiderConnected(rider.id),
    );

    const searchTime = Date.now() - startTime;

    const result: ProximitySearchResult = {
      orderId: orderLocation.orderId,
      restaurantLocation: orderLocation.restaurantLocation,
      nearbyRiders,
      searchRadius: this.DEFAULT_SEARCH_RADIUS,
      totalRidersFound: nearbyRiders.length,
      connectedRidersCount: connectedRiders.length,
    };

    this.logger.log(
      `✅ PROXIMITY SEARCH COMPLETED in ${searchTime}ms:\n` +
        `   → Order ID: ${orderLocation.orderId}\n` +
        `   → Total nearby riders: ${nearbyRiders.length}\n` +
        `   → Online riders: ${connectedRiders.length}\n` +
        `   → Search radius: ${this.DEFAULT_SEARCH_RADIUS}km`,
    );

    // Send targeted notifications to connected riders
    await this.sendTargetedRiderNotifications(orderLocation.orderId, connectedRiders, orderLocation.restaurantLocation);

    // Broadcast results to dispatch dashboard
    await this.broadcastProximityResults(result);

    return result;
  }

  /**
   * Get nearby riders for a specific order from database
   * @param orderId Order ID
   * @returns Proximity search results or null if order not found
   */
  async getOrderProximityResults(
    orderId: number,
  ): Promise<ProximitySearchResult | null> {
    const knexInstance = this.knex.getKnex();

    try {
      // Get order with calculated_order data
      const order: any = await knexInstance('orders')
        .leftJoin(
          'calculated_orders',
          'orders.calculated_order_id',
          'calculated_orders.id',
        )
        .select([
          'orders.id as order_id',
          'calculated_orders.lat',
          'calculated_orders.lng',
        ])
        .where('orders.id', orderId)
        .first();

      this.logger.log(
        `Order query result for ID ${orderId}:`,
        JSON.stringify(order),
      );

      if (!order || !order.lat || !order.lng) {
        this.logger.warn(
          `Order ${orderId} not found or missing location data. Order:`,
          JSON.stringify(order),
        );
        return null;
      }

      const restaurantLocation: Location = {
        latitude: parseFloat(String(order.lat)),
        longitude: parseFloat(String(order.lng)),
      };

      return await this.performOrderProximitySearch({
        orderId,
        restaurantLocation,
      });
    } catch (error) {
      this.logger.error(
        `Error getting proximity results for order ${orderId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Send targeted notifications to nearby riders about new orders
   * @param orderId Order ID
   * @param nearbyRiders List of nearby riders
   * @param restaurantLocation Restaurant location
   */
  private async sendTargetedRiderNotifications(
    orderId: number,
    nearbyRiders: any[],
    restaurantLocation: Location,
  ): Promise<void> {
    if (nearbyRiders.length === 0) {
      this.logger.log(`📭 No connected riders to notify for Order #${orderId}`);
      return;
    }

    this.logger.log(`📨 SENDING TARGETED NOTIFICATIONS for Order #${orderId} to ${nearbyRiders.length} rider(s)`);

    const knexInstance = this.knex.getKnex();

    try {
      // Get order details
      const orderDetails = await knexInstance('orders')
        .leftJoin('calculated_orders', 'orders.calculated_order_id', 'calculated_orders.id')
        .select(
          'orders.id as order_id',
          'orders.order_code',
          'calculated_orders.restaurant_name',
          'calculated_orders.pickup_address',
          'calculated_orders.customer_name',
          'calculated_orders.total_amount'
        )
        .where('orders.id', orderId)
        .first();

      if (!orderDetails) {
        this.logger.warn(`Order #${orderId} not found for notifications`);
        return;
      }

      // Send notification to each nearby rider
      let notificationsSent = 0;
      let notificationsFailed = 0;

      for (const rider of nearbyRiders) {
        const notification = {
          type: 'new_order_notification',
          data: {
            orderId: orderDetails.order_id,
            orderCode: orderDetails.order_code,
            restaurantName: orderDetails.restaurant_name,
            pickupAddress: orderDetails.pickup_address,
            customerName: orderDetails.customer_name,
            totalAmount: orderDetails.total_amount,
            distance: rider.distance_km,
            restaurantLocation: {
              latitude: restaurantLocation.latitude,
              longitude: restaurantLocation.longitude,
            },
            estimatedPickupTime: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20 minutes from now
          },
          timestamp: new Date().toISOString(),
          messageId: `order-notification-${orderId}-${rider.id}-${Date.now()}`,
        };

        const success = this.connectionManager.sendToRider(rider.id, notification);
        
        if (success) {
          notificationsSent++;
          this.logger.log(`   ✅ Notification sent to ${rider.name} (ID: ${rider.id}) - ${rider.distance_km}km away`);
        } else {
          notificationsFailed++;
          this.logger.warn(`   ❌ Failed to notify ${rider.name} (ID: ${rider.id}) - not connected`);
        }
      }

      this.logger.log(`📊 NOTIFICATION SUMMARY for Order #${orderId}:
   → Total riders found: ${nearbyRiders.length}
   → Notifications sent: ${notificationsSent}
   → Notifications failed: ${notificationsFailed}`);

    } catch (error) {
      this.logger.error(`Error sending targeted notifications for Order #${orderId}:`, error.message);
    }
  }

  /**
   * Broadcast proximity search results to dispatch dashboard
   */
  private async broadcastProximityResults(
    result: ProximitySearchResult,
  ): Promise<void> {
    const message = {
      type: 'proximity_search_results',
      orderId: result.orderId,
      restaurantLocation: result.restaurantLocation,
      nearbyRiders: result.nearbyRiders.map((rider) => ({
        id: rider.id,
        name: rider.name,
        distance_km: rider.distance_km,
        isConnected: this.connectionManager.isRiderConnected(rider.id),
      })),
      totalFound: result.totalRidersFound,
      connectedCount: result.connectedRidersCount,
      searchRadius: result.searchRadius,
      timestamp: new Date().toISOString(),
    };

    const stats = this.connectionManager.getConnectionStats();
    this.connectionManager.broadcastToDispatch(message);

    this.logger.debug(
      `📡 Proximity results broadcasted to ${stats.connectedDispatchers} dispatch dashboard(s)`,
    );
  }

  /**
   * Update rider location and trigger proximity recalculation for active orders
   * @param riderId Rider ID
   * @param location New location
   */
  async updateRiderLocationAndRecalculate(
    riderId: number,
    location: Location,
  ): Promise<void> {
    const knexInstance = this.knex.getKnex();

    try {
      // Update rider location in database
      await knexInstance('riders').where('id', riderId).update({
        current_latitude: location.latitude,
        current_longitude: location.longitude,
        last_location_update: new Date(),
      });

      // Find active orders that might be affected by this location update
      const activeOrders = await knexInstance('orders')
        .leftJoin(
          'calculated_orders',
          'orders.calculated_order_id',
          'calculated_orders.id',
        )
        .select([
          'orders.id as order_id',
          'calculated_orders.lat',
          'calculated_orders.lng',
        ])
        .where('orders.completed', false)
        .where('orders.cancelled', false)
        .whereNull('orders.rider_id')
        .whereNotNull('calculated_orders.lat')
        .whereNotNull('calculated_orders.lng')
        .limit(10); // Limit to prevent performance issues

      // Check if rider is now within range of any active orders
      for (const order of activeOrders) {
        const restaurantLocation: Location = {
          latitude: order.lat,
          longitude: order.lng,
        };

        const distance = this.proximityService.calculateDistance(
          restaurantLocation,
          location,
        );

        if (distance <= this.DEFAULT_SEARCH_RADIUS) {
          this.logger.log(
            `🔄 Rider ${riderId} moved within range of Order #${order.order_id} (${distance}km)`,
          );

          // Trigger new proximity search for this order
          await this.performOrderProximitySearch({
            orderId: order.order_id,
            restaurantLocation,
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `Error updating rider location and recalculating proximity:`,
        error,
      );
    }
  }
}
