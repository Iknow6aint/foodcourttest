// Export all models
export * from './order.model';
export * from './calculated-order.model';
export * from './log.model';
export * from './order-amount-history.model';
export * from './order-type.model';
export * from './rider.model';

// Import types for interfaces
import { Order } from './order.model';
import { Log } from './log.model';
import { CalculatedOrder } from './calculated-order.model';
import { OrderType } from './order-type.model';
import { OrderAmountHistory } from './order-amount-history.model';
import { Rider } from './rider.model';

// Type guards and utility types
export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'prepared'
  | 'dispatched'
  | 'completed'
  | 'cancelled';

export interface OrderWithRelations
  extends Omit<
    Order,
    'logs' | 'calculated_order' | 'order_type' | 'order_total_amount_history'
  > {
  logs: Log[];
  calculated_order: CalculatedOrder | null;
  order_type: OrderType | null;
  order_total_amount_history: OrderAmountHistory[];
  rider?: Rider | null; // Added rider relationship
}
