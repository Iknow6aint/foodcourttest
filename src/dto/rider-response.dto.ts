import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '../models/rider.model';

/**
 * DTO for rider public profile response
 */
export class RiderPublicProfileDto {
  @ApiProperty({ description: 'Rider unique identifier', example: 1 })
  id: number;

  @ApiProperty({ description: 'Rider full name', example: 'John Doe' })
  name: string;

  @ApiProperty({
    description: 'Rider email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({ description: 'Rider phone number', example: '+1234567890' })
  phone: string;

  @ApiProperty({ description: 'Rider availability status', example: true })
  is_available: boolean;

  @ApiPropertyOptional({
    description: 'Vehicle type',
    enum: VehicleType,
    example: VehicleType.MOTORCYCLE,
  })
  vehicle_type: VehicleType | null;

  @ApiPropertyOptional({
    description: 'Profile image URL',
    example: 'https://example.com/images/profile.jpg',
  })
  profile_image_url: string | null;

  @ApiProperty({
    description: 'Account creation date',
    example: '2025-07-22T10:30:00Z',
  })
  created_at: Date;
}

/**
 * DTO for rider location response
 */
export class RiderLocationDto {
  @ApiProperty({ description: 'Rider unique identifier', example: 1 })
  id: number;

  @ApiProperty({ description: 'Rider full name', example: 'John Doe' })
  name: string;

  @ApiPropertyOptional({
    description: 'Current latitude coordinate',
    example: 37.7749,
  })
  current_latitude: number | null;

  @ApiPropertyOptional({
    description: 'Current longitude coordinate',
    example: -122.4194,
  })
  current_longitude: number | null;

  @ApiPropertyOptional({
    description: 'Last location update timestamp',
    example: '2025-07-22T10:30:00Z',
  })
  last_location_update: Date | null;

  @ApiProperty({ description: 'Rider availability status', example: true })
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
