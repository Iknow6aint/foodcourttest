import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

/**
 * Base WebSocket message structure
 */
export class WebSocketMessageDto {
  @ApiProperty({
    description: 'Message type identifier',
    example: 'location_update',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Message payload data',
    example: { latitude: 37.7749, longitude: -122.4194 },
  })
  @IsObject()
  @IsOptional()
  data?: any;

  @ApiProperty({
    description: 'ISO timestamp when message was created',
    example: '2025-07-22T15:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsString()
  @IsOptional()
  timestamp?: string;

  @ApiProperty({
    description: 'Unique message identifier',
    example: 'msg-12345',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  messageId?: string;
}

/**
 * Location update message for real-time tracking
 */
export interface LocationUpdateMessageDto {
  type: 'location_update';
  data: {
    riderId: number;
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  timestamp?: string;
  messageId?: string;
}

/**
 * Order assignment notification message
 */
export interface OrderAssignmentMessageDto {
  type: 'order_assigned';
  data: {
    orderId: number;
    riderId: number;
    customerAddress: string;
    estimatedDeliveryTime: string;
  };
  timestamp?: string;
  messageId?: string;
}

/**
 * Connection status message
 */
export interface ConnectionStatusMessageDto {
  type: 'connection_status' | 'rider_connected' | 'rider_disconnected';
  data: {
    riderId: number;
    status: 'connected' | 'disconnected';
    connectedAt?: string;
    disconnectedAt?: string;
  };
  timestamp?: string;
  messageId?: string;
}

/**
 * Error message for WebSocket communication
 */
export interface WebSocketErrorMessageDto {
  type: 'error';
  data: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp?: string;
  messageId?: string;
}
