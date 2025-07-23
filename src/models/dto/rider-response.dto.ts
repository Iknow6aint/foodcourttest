import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '../rider.model';

/**
 * DTO for rider public profile response
 */
export class RiderPublicProfileDto {
  @ApiProperty({
    description: 'Rider unique identifier',
    example: 1,
    type: 'integer',
  })
  id: number;

  @ApiProperty({
    description: 'Rider full name',
    example: 'James Wilson',
    maxLength: 255,
  })
  name: string;

  @ApiProperty({
    description: 'Rider email address',
    example: 'james.wilson@fooddelivery.com',
    format: 'email',
    maxLength: 255,
  })
  email: string;

  @ApiProperty({
    description: 'Rider phone number',
    example: '+2348123456789',
    pattern: '^\\+?[\\d\\s\\-()]{10,20}$',
  })
  phone: string;

  @ApiProperty({
    description: 'Rider availability status',
    example: true,
    type: 'boolean',
  })
  is_available: boolean;

  @ApiPropertyOptional({
    description: 'Vehicle type used by rider',
    enum: VehicleType,
    example: VehicleType.MOTORCYCLE,
    nullable: true,
  })
  vehicle_type: VehicleType | null;

  @ApiPropertyOptional({
    description: 'URL to rider profile image',
    example: 'https://example.com/images/james-wilson.jpg',
    format: 'uri',
    nullable: true,
  })
  profile_image_url: string | null;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2025-07-22T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  created_at: Date;
}

/**
 * DTO for rider location response
 */
export class RiderLocationDto {
  @ApiProperty({
    description: 'Rider unique identifier',
    example: 1,
    type: 'integer',
  })
  id: number;

  @ApiProperty({
    description: 'Rider full name',
    example: 'James Wilson',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Current latitude coordinate',
    example: 37.7749,
    type: 'number',
    format: 'float',
    minimum: -90,
    maximum: 90,
    nullable: true,
  })
  current_latitude: number | null;

  @ApiPropertyOptional({
    description: 'Current longitude coordinate',
    example: -122.4194,
    type: 'number',
    format: 'float',
    minimum: -180,
    maximum: 180,
    nullable: true,
  })
  current_longitude: number | null;

  @ApiPropertyOptional({
    description: 'Timestamp of last location update',
    example: '2025-07-22T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  last_location_update: Date | null;

  @ApiProperty({
    description: 'Rider availability status',
    example: true,
    type: 'boolean',
  })
  is_available: boolean;
}

/**
 * DTO for location update response
 */
export class LocationUpdateResponseDto {
  @ApiProperty({ description: 'Update success status', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Location updated successfully',
  })
  message: string;

  @ApiProperty({ description: 'Updated rider location data' })
  data: RiderLocationDto;

  @ApiProperty({
    description: 'Update timestamp',
    example: '2025-07-22T10:30:00Z',
  })
  timestamp: Date;
}

/**
 * DTO for standard API response
 */
export class ApiResponseDto<T> {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully',
  })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data: T;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2025-07-22T10:30:00Z',
  })
  timestamp: Date;
}

/**
 * DTO for rider authentication response (signup/signin)
 */
export class RiderAuthResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Sign in successful',
  })
  message: string;

  @ApiProperty({
    description: 'Authentication data',
  })
  data: {
    rider: RiderPublicProfileDto;
    token: string;
  };

  @ApiProperty({
    description: 'Response timestamp',
    example: '2025-07-22T10:30:00Z',
  })
  timestamp: Date;
}
