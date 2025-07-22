// Export all models
export * from './order.model';
export * from './calculated-order.model';
export * from './log.model';
export * from './order-amount-history.model';
export * from './order-type.model';

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
    import('./order.model').Order,
    'logs' | 'calculated_order' | 'order_type' | 'order_total_amount_history'
  > {
  logs: import('./log.model').Log[];
  calculated_order: import('./calculated-order.model').CalculatedOrder | null;
  order_type: import('./order-type.model').OrderType | null;
  order_total_amount_history: import('./order-amount-history.model').OrderAmountHistory[];
}
