import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Knex } from 'knex';
import { Order } from '../models/order.model';
import { KnexService } from '../database/knex.service';

interface MostBoughtMeal {
  name: string;
  total_quantity: number;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  private readonly knex: Knex;

  constructor(private readonly knexService: KnexService) {
    this.knex = this.knexService.knex;
  }

  /**
   * Get all orders along with logs, calculated order, and order type.
   */
  async getAllOrdersWithDetails(): Promise<Order[]> {
    try {
      if (this.knex instanceof Error) {
        this.logger.error('Knex instance is an error', this.knex.message);
        throw new InternalServerErrorException('Database connection error');
      }

      const result = await this.knex.raw(`
        SELECT 
          o.id,
          o.user_id,
          o.completed,
          o.cancelled,
          o.paid,
          o.order_code,
          o.rider_id,
          o.calculated_order_id,
          o.order_type_id,
          o.created_at,
          o.updated_at,
          COALESCE(json_agg(DISTINCT l) FILTER (WHERE l.id IS NOT NULL), '[]') AS logs,
          to_jsonb(co.*) AS calculated_order,
          to_jsonb(ot.*) AS order_type
        FROM orders o
        LEFT JOIN logs l ON l.order_id = o.id
        LEFT JOIN calculated_orders co ON co.id = o.calculated_order_id
        LEFT JOIN order_types ot ON ot.id = o.order_type_id
        GROUP BY o.id, co.id, ot.id
        ORDER BY o.created_at DESC
      `);

      const orders = result.rows as Order[];

      if (!orders.length) {
        this.logger.warn('No orders found in the database.');
        throw new NotFoundException('No orders found');
      }

      return orders;
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(
        'Failed to fetch orders with details',
        error.stack || error.message,
      );
      throw new InternalServerErrorException(
        'Something went wrong while fetching order details',
      );
    }
  }

  /**
   * Get the most bought meal by analyzing order amounts and frequency.
   * Since there's no meals table, this analyzes order patterns.
   */
  async getMostBoughtMeal(): Promise<MostBoughtMeal> {
    try {
      if (this.knex instanceof Error) {
        this.logger.error('Knex instance is an error', this.knex.message);
        throw new InternalServerErrorException('Database connection error');
      }

      // Since there's no meals table, we'll analyze order types and amounts
      const result = await this.knex.raw(`
        SELECT 
          ot.name, 
          COUNT(o.id) AS total_quantity,
          SUM(co.total_amount) AS total_revenue
        FROM orders o
        INNER JOIN order_types ot ON ot.id = o.order_type_id
        INNER JOIN calculated_orders co ON co.id = o.calculated_order_id
        WHERE o.completed = true AND o.cancelled = false
        GROUP BY ot.id, ot.name
        ORDER BY total_quantity DESC, total_revenue DESC
        LIMIT 1
      `);

      const meal = result.rows[0] as MostBoughtMeal;

      if (!meal) {
        this.logger.warn(
          'No completed orders found to determine most bought meal type.',
        );
        throw new NotFoundException('No completed orders found');
      }

      return {
        name: meal.name,
        total_quantity: Number(meal.total_quantity),
      };
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(
        'Failed to fetch most bought meal',
        error.stack || error.message,
      );
      throw new InternalServerErrorException(
        'Something went wrong while fetching the most bought meal',
      );
    }
  }
}
