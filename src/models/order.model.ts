import { Log } from './log.model';
import { CalculatedOrder } from './calculated-order.model';
import { OrderType } from './order-type.model';
import { OrderAmountHistory } from './order-amount-history.model';

export interface Order {
  id: number;
  user_id: number;
  completed: boolean;
  cancelled: boolean;
  kitchen_cancelled: boolean;
  kitchen_accepted: boolean;
  kitchen_dispatched: boolean;
  kitchen_dispatched_time: Date | null;
  completed_time: Date | null;
  rider_id: number | null;
  kitchen_prepared: boolean;
  rider_assigned: boolean;
  paid: boolean;
  order_code: string;
  order_change: Record<string, any> | null;
  calculated_order_id: number | null;
  kitchen_verified_time: Date | null;
  kitchen_completed_time: Date | null;
  shop_accepted: boolean;
  shop_prepared: boolean;
  no_of_mealbags_delivered: number;
  no_of_drinks_delivered: number;
  rider_started_time: Date | null;
  rider_started: boolean;
  rider_arrived_time: Date | null;
  rider_arrived: boolean;
  is_failed_trip: boolean;
  failed_trip_details: Record<string, any> | null;
  box_number: string | null;
  shelf_id: number | null;
  scheduled: boolean;
  confirmed_by_id: number | null;
  completed_by_id: number | null;
  scheduled_delivery_date: Date | null;
  scheduled_delivery_time: string | null;
  is_hidden: boolean;
  order_type_id: number | null;
  created_at: Date;
  updated_at: Date;

  // Nested relationships (when joined)
  logs?: Log[];
  calculated_order?: CalculatedOrder;
  order_type?: OrderType;
  order_total_amount_history?: OrderAmountHistory[];
}
