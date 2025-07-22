import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { KnexService } from '../database/knex.service';
import { OrderResponseDto } from '../models/dto/order-response.dto';
import { MostBoughtMealResponseDto } from '../models/dto/most-bought-meal-response.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private readonly knexService: KnexService) {}

  private get knex() {
    return this.knexService.getKnex();
  }

  /**
   * Get all orders along with their related data using raw SQL query
   * This query joins orders with logs, calculated_orders, order_types, and order_amount_history
   */
  async getAllOrdersWithDetails(): Promise<OrderResponseDto[]> {
    try {
      const result = await this.knex.raw(`
        SELECT 
          o.id,
          o.user_id,
          o.completed,
          o.cancelled,
          o.kitchen_cancelled,
          o.kitchen_accepted,
          o.kitchen_dispatched,
          o.kitchen_dispatched_time,
          o.completed_time,
          o.rider_id,
          o.kitchen_prepared,
          o.rider_assigned,
          o.paid,
          o.order_code,
          o.order_change,
          o.calculated_order_id,
          o.kitchen_verified_time,
          o.kitchen_completed_time,
          o.shop_accepted,
          o.shop_prepared,
          o.no_of_mealbags_delivered,
          o.no_of_drinks_delivered,
          o.rider_started_time,
          o.rider_started,
          o.rider_arrived_time,
          o.rider_arrived,
          o.is_failed_trip,
          o.failed_trip_details,
          o.box_number,
          o.shelf_id,
          o.scheduled,
          o.confirmed_by_id,
          o.completed_by_id,
          o.scheduled_delivery_date,
          o.scheduled_delivery_time,
          o.is_hidden,
          o.order_type_id,
          o.created_at,
          o.updated_at,
          -- Aggregate logs as JSON array
          COALESCE(
            json_agg(
              jsonb_build_object(
                'time', l.time,
                'description', l.description
              ) ORDER BY l.time
            ) FILTER (WHERE l.id IS NOT NULL), 
            '[]'::json
          ) AS logs,
          -- Complete calculated order details as JSON
          CASE 
            WHEN co.id IS NOT NULL THEN 
              to_jsonb(co.*)
            ELSE NULL
          END AS calculated_order,
          -- Order type details as JSON
          CASE 
            WHEN ot.id IS NOT NULL THEN 
              to_jsonb(ot.*)
            ELSE NULL
          END AS order_type
        FROM orders o
        LEFT JOIN logs l ON l.order_id = o.id
        LEFT JOIN calculated_orders co ON co.id = o.calculated_order_id
        LEFT JOIN order_types ot ON ot.id = o.order_type_id
        GROUP BY o.id, co.id, ot.id
        ORDER BY o.created_at DESC
      `);

      const ordersWithDetails = result.rows as OrderResponseDto[];

      if (!ordersWithDetails.length) {
        this.logger.warn('No orders found in the database.');
        throw new NotFoundException('No orders found');
      }

      // Get order amount history separately for each order to avoid complex aggregation
      for (const order of ordersWithDetails) {
        const historyResult = await this.knex.raw(
          `
          SELECT 
            oah.time,
            oah.total_amount
          FROM order_amount_history oah
          WHERE oah.order_id = ?
          ORDER BY oah.time ASC
        `,
          [order.id],
        );

        (order as any).order_total_amount_history = historyResult.rows || [];
      }

      this.logger.log(
        `Retrieved ${ordersWithDetails.length} orders with complete details using raw SQL`,
      );
      return ordersWithDetails;
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(
        'Failed to fetch orders with details using raw SQL',
        error.stack || error.message,
      );
      throw new InternalServerErrorException(
        'Something went wrong while fetching order details',
      );
    }
  }

  /**
   * Find the most bought meal using raw SQL query
   * This query extracts meals from JSONB arrays and aggregates quantities
   */
  async getMostBoughtMeal(): Promise<MostBoughtMealResponseDto> {
    try {
      const result = await this.knex.raw(`
        WITH meal_extractions AS (
          -- Extract individual meals from the JSONB meals array structure
          SELECT 
            o.id as order_id,
            o.completed,
            o.cancelled,
            meal_group.value ->> 'brand' as brand_info,
            meal_item.value ->> 'name' as meal_name,
            meal_item.value ->> 'id' as meal_id,
            COALESCE((meal_item.value ->> 'quantity')::integer, 1) as meal_quantity,
            COALESCE((meal_item.value ->> 'amount')::integer, 0) as meal_amount
          FROM orders o
          INNER JOIN calculated_orders co ON co.id = o.calculated_order_id
          CROSS JOIN LATERAL jsonb_array_elements(COALESCE(co.meals, '[]'::jsonb)) as meal_group(value)
          CROSS JOIN LATERAL jsonb_array_elements(COALESCE(meal_group.value -> 'meals', '[]'::jsonb)) as meal_item(value)
          WHERE o.completed = true 
            AND o.cancelled = false
            AND co.meals IS NOT NULL
            AND jsonb_array_length(co.meals) > 0
        ),
        meal_totals AS (
          -- Aggregate meal quantities and calculate totals
          SELECT 
            meal_name,
            meal_id,
            SUM(meal_quantity) as total_quantity,
            SUM(meal_amount * meal_quantity) as total_revenue,
            COUNT(DISTINCT order_id) as order_count
          FROM meal_extractions
          WHERE meal_name IS NOT NULL AND meal_name != ''
          GROUP BY meal_name, meal_id
        )
        SELECT 
          meal_name as name,
          total_quantity,
          total_revenue,
          order_count
        FROM meal_totals
        WHERE total_quantity > 0
        ORDER BY total_quantity DESC, total_revenue DESC, order_count DESC
        LIMIT 1
      `);

      const mostBoughtMealResult = result
        .rows[0] as MostBoughtMealResponseDto & {
        total_revenue: number;
        order_count: number;
      };

      if (!mostBoughtMealResult) {
        this.logger.warn(
          'No completed orders with meals found to determine most bought meal.',
        );
        throw new NotFoundException('No completed orders with meals found');
      }

      const mostBoughtMeal: MostBoughtMealResponseDto = {
        name: mostBoughtMealResult.name,
        total_quantity: Number(mostBoughtMealResult.total_quantity),
      };

      this.logger.log(
        `Most bought meal found using raw SQL: "${mostBoughtMeal.name}" with ${mostBoughtMeal.total_quantity} total quantity across ${mostBoughtMealResult.order_count} orders (Total revenue: ${mostBoughtMealResult.total_revenue})`,
      );

      return mostBoughtMeal;
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(
        'Failed to fetch most bought meal using raw SQL',
        error.stack || error.message,
      );
      throw new InternalServerErrorException(
        'Something went wrong while fetching the most bought meal',
      );
    }
  }
}
