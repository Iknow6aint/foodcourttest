export const rabbitMQConfig = {
  uri: process.env.RABBITMQ_URI || 'amqp://localhost',
  queues: {
    orderQueue: 'order_created_queue',
  },
  options: {
    durable: true,
    persistent: true,
  },
  retryAttempts: 5,
  retryDelay: 2000,
};
