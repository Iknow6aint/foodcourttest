// Queue names for RabbitMQ
export const ORDER_QUEUE = 'order_created_queue';

// Message types
export enum MessageType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
}

// Additional queue names for future use
