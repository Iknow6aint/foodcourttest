import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { MessageType } from '../rabbitmq/queue.constants';

@ApiTags('RabbitMQ')
@Controller('rabbitmq')
export class RabbitMQController {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  @Post('test-order')
  @ApiOperation({
    summary: 'Test RabbitMQ by publishing a test order message',
    description: 'Publishes a test order created message to RabbitMQ queue for testing purposes',
  })
  @ApiResponse({
    status: 200,
    description: 'Test message published successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to publish test message',
  })
  async publishTestOrder(@Body() testData?: any) {
    const testOrderData = testData || {
      orderCode: 'TEST_' + Date.now(),
      items: [{ name: 'Test Meal', quantity: 1, price: 10.99 }],
      total: 10.99,
    };

    await this.rabbitMQService.publishOrderCreated(
      Date.now(), // orderId
      1, // userId
      testOrderData
    );

    return {
      message: 'Test order message published successfully',
      data: testOrderData,
    };
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get RabbitMQ connection status',
    description: 'Returns the current connection status and health of RabbitMQ service',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection status retrieved successfully',
  })
  getConnectionStatus() {
    const status = this.rabbitMQService.getConnectionStatus();
    return {
      status: status.connected ? 'connected' : 'disconnected',
      reconnectAttempts: status.attempts,
      timestamp: new Date().toISOString(),
    };
  }
}
