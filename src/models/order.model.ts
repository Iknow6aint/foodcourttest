export interface Order {
  id: number;
  user_id: number;
  completed: boolean;
  cancelled: boolean;
  paid: boolean;
  order_code: string;
  calculated_order_id: number | null;
  order_type_id: number | null;
  created_at: Date;
  updated_at: Date;
}
