import { ApiProperty } from '@nestjs/swagger';
import { LogDto } from './log.dto';
import { CalculatedOrderDto } from './calculated-order.dto';
import { OrderTypeDto } from './order-type.dto';
import { OrderAmountHistoryDto } from './order-amount-history.dto';

export class OrderResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the order',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'User ID who placed the order',
    example: 2,
  })
  user_id: number;

  @ApiProperty({
    description: 'Whether the order is completed',
    example: true,
  })
  completed: boolean;

  @ApiProperty({
    description: 'Whether the order is cancelled',
    example: false,
  })
  cancelled: boolean;

  @ApiProperty({
    description: 'Whether the kitchen cancelled the order',
    example: false,
  })
  kitchen_cancelled: boolean;

  @ApiProperty({
    description: 'Whether the kitchen accepted the order',
    example: true,
  })
  kitchen_accepted: boolean;

  @ApiProperty({
    description: 'Whether the kitchen dispatched the order',
    example: true,
  })
  kitchen_dispatched: boolean;

  @ApiProperty({
    description: 'Timestamp when kitchen dispatched the order',
    example: '2025-07-22T10:45:00.000Z',
    nullable: true,
  })
  kitchen_dispatched_time?: Date;

  @ApiProperty({
    description: 'Timestamp when the order was completed',
    example: '2025-07-22T11:00:00.000Z',
    nullable: true,
  })
  completed_time?: Date;

  @ApiProperty({
    description: 'ID of the assigned rider',
    example: 5,
    nullable: true,
  })
  rider_id?: number;

  @ApiProperty({
    description: 'Whether the kitchen prepared the order',
    example: true,
  })
  kitchen_prepared: boolean;

  @ApiProperty({
    description: 'Whether a rider is assigned',
    example: true,
  })
  rider_assigned: boolean;

  @ApiProperty({
    description: 'Whether the order is paid',
    example: true,
  })
  paid: boolean;

  @ApiProperty({
    description: 'Unique order code',
    example: 'ORD-2025-001',
  })
  order_code: string;

  @ApiProperty({
    description: 'Order change details as JSON',
    example: { reason: 'Customer request', amount_changed: 100 },
    nullable: true,
  })
  order_change?: Record<string, any>;

  @ApiProperty({
    description: 'ID of the calculated order',
    example: 1,
    nullable: true,
  })
  calculated_order_id?: number;

  @ApiProperty({
    description: 'Timestamp when kitchen verified the order',
    example: '2025-07-22T10:35:00.000Z',
    nullable: true,
  })
  kitchen_verified_time?: Date;

  @ApiProperty({
    description: 'Timestamp when kitchen completed the order',
    example: '2025-07-22T10:50:00.000Z',
    nullable: true,
  })
  kitchen_completed_time?: Date;

  @ApiProperty({
    description: 'Whether the shop accepted the order',
    example: true,
  })
  shop_accepted: boolean;

  @ApiProperty({
    description: 'Whether the shop prepared the order',
    example: true,
  })
  shop_prepared: boolean;

  @ApiProperty({
    description: 'Number of meal bags delivered',
    example: 2,
  })
  no_of_mealbags_delivered: number;

  @ApiProperty({
    description: 'Number of drinks delivered',
    example: 1,
  })
  no_of_drinks_delivered: number;

  @ApiProperty({
    description: 'Timestamp when rider started delivery',
    example: '2025-07-22T10:55:00.000Z',
    nullable: true,
  })
  rider_started_time?: Date;

  @ApiProperty({
    description: 'Whether the rider started delivery',
    example: true,
  })
  rider_started: boolean;

  @ApiProperty({
    description: 'Timestamp when rider arrived',
    example: '2025-07-22T11:00:00.000Z',
    nullable: true,
  })
  rider_arrived_time?: Date;

  @ApiProperty({
    description: 'Whether the rider arrived',
    example: true,
  })
  rider_arrived: boolean;

  @ApiProperty({
    description: 'Whether this was a failed trip',
    example: false,
  })
  is_failed_trip: boolean;

  @ApiProperty({
    description: 'Details about failed trip',
    example: { reason: 'Customer not available', retry_count: 2 },
    nullable: true,
  })
  failed_trip_details?: Record<string, any>;

  @ApiProperty({
    description: 'Box number for storage',
    example: 'B-12',
    nullable: true,
  })
  box_number?: string;

  @ApiProperty({
    description: 'Shelf ID for storage',
    example: 3,
    nullable: true,
  })
  shelf_id?: number;

  @ApiProperty({
    description: 'Whether the order is scheduled',
    example: false,
  })
  scheduled: boolean;

  @ApiProperty({
    description: 'ID of user who confirmed the order',
    example: 1,
    nullable: true,
  })
  confirmed_by_id?: number;

  @ApiProperty({
    description: 'ID of user who completed the order',
    example: 1,
    nullable: true,
  })
  completed_by_id?: number;

  @ApiProperty({
    description: 'Scheduled delivery date',
    example: '2025-07-22',
    nullable: true,
  })
  scheduled_delivery_date?: Date;

  @ApiProperty({
    description: 'Scheduled delivery time',
    example: '14:30',
    nullable: true,
  })
  scheduled_delivery_time?: string;

  @ApiProperty({
    description: 'Whether the order is hidden',
    example: false,
  })
  is_hidden: boolean;

  @ApiProperty({
    description: 'ID of the order type',
    example: 1,
    nullable: true,
  })
  order_type_id?: number;

  @ApiProperty({
    description: 'Timestamp when the order was created',
    example: '2025-07-22T10:30:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the order was last updated',
    example: '2025-07-22T11:00:00.000Z',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Array of logs associated with this order',
    type: [LogDto],
  })
  logs: LogDto[];

  @ApiProperty({
    description: 'Calculated order details',
    type: CalculatedOrderDto,
    nullable: true,
  })
  calculated_order?: CalculatedOrderDto;

  @ApiProperty({
    description: 'Order type details',
    type: OrderTypeDto,
    nullable: true,
  })
  order_type?: OrderTypeDto;

  @ApiProperty({
    description: 'Order amount history',
    type: [OrderAmountHistoryDto],
  })
  order_total_amount_history: OrderAmountHistoryDto[];
}
