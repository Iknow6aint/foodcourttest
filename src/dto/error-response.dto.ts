import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard error response DTO for API endpoints
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
    type: 'number',
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message or array of validation errors',
    oneOf: [
      {
        type: 'string',
        example: 'Rider with ID 999 not found or inactive',
      },
      {
        type: 'array',
        items: { type: 'string' },
        example: [
          'Latitude must be between -90 and 90',
          'Longitude must be between -180 and 180',
        ],
      },
    ],
  })
  message: string | string[];

  @ApiProperty({
    description: 'Error type/category',
    example: 'Bad Request',
    type: 'string',
  })
  error: string;

  @ApiProperty({
    description: 'ISO timestamp when error occurred',
    example: '2025-07-22T12:35:44.623Z',
    type: 'string',
    format: 'date-time',
  })
  timestamp?: string;

  @ApiProperty({
    description: 'Request path that caused the error',
    example: '/api/riders/me/location',
    type: 'string',
  })
  path?: string;
}

/**
 * Validation error response specifically for input validation failures
 */
export class ValidationErrorResponseDto {
  @ApiProperty({
    description: 'Array of detailed validation error messages',
    type: 'array',
    items: { type: 'string' },
    example: [
      'Latitude must be between -90 and 90',
      'Longitude must be between -180 and 180',
      'Vehicle type must be bicycle, motorcycle, or car',
    ],
  })
  message: string[];

  @ApiProperty({
    description: 'HTTP status code for validation errors',
    example: 400,
    type: 'number',
    enum: [400],
  })
  statusCode: 400;

  @ApiProperty({
    description: 'Error type for validation errors',
    example: 'Bad Request',
    type: 'string',
    enum: ['Bad Request'],
  })
  error: 'Bad Request';
}

/**
 * Authentication error response for unauthorized access
 */
export class UnauthorizedErrorResponseDto {
  @ApiProperty({
    description: 'Authentication error message',
    example: 'Valid rider authentication required',
    type: 'string',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code for authentication errors',
    example: 401,
    type: 'number',
    enum: [401],
  })
  statusCode: 401;

  @ApiProperty({
    description: 'Error type for authentication errors',
    example: 'Unauthorized',
    type: 'string',
    enum: ['Unauthorized'],
  })
  error: 'Unauthorized';
}

/**
 * Not found error response for missing resources
 */
export class NotFoundErrorResponseDto {
  @ApiProperty({
    description: 'Resource not found error message',
    example: 'Rider with ID 999 not found or inactive',
    type: 'string',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code for not found errors',
    example: 404,
    type: 'number',
    enum: [404],
  })
  statusCode: 404;

  @ApiProperty({
    description: 'Error type for not found errors',
    example: 'Not Found',
    type: 'string',
    enum: ['Not Found'],
  })
  error: 'Not Found';
}
