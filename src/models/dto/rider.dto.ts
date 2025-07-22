import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUrl,
  IsInt,
  IsPositive,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { VehicleType } from '../rider.model';

/**
 * DTO for rider location updates
 */
export class RiderLocationUpdateDto {
  @ApiProperty({
    description: 'Latitude coordinate (-90 to 90)',
    example: 37.7749,
    minimum: -90,
    maximum: 90,
    type: 'number',
    format: 'float',
  })
  @IsNumber({}, { message: 'Latitude must be a valid number' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  current_latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate (-180 to 180)',
    example: -122.4194,
    minimum: -180,
    maximum: 180,
    type: 'number',
    format: 'float',
  })
  @IsNumber({}, { message: 'Longitude must be a valid number' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  current_longitude: number;
}

/**
 * DTO for rider availability updates
 */
export class RiderAvailabilityUpdateDto {
  @ApiProperty({
    description: 'Rider availability status',
    example: true,
  })
  @IsBoolean({ message: 'is_available must be a boolean value' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  is_available: boolean;
}

/**
 * DTO for rider profile updates
 */
export class RiderProfileUpdateDto {
  @ApiPropertyOptional({
    description: 'Rider full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Name cannot exceed 255 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Rider phone number',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @Matches(/^\+?[\d\s\-\(\)]{10,20}$/, {
    message: 'Phone must be a valid phone number',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Vehicle type',
    enum: VehicleType,
    example: VehicleType.MOTORCYCLE,
  })
  @IsOptional()
  @IsEnum(VehicleType, { message: 'Vehicle type must be a valid vehicle type' })
  vehicle_type?: VehicleType;

  @ApiPropertyOptional({
    description: 'Vehicle license plate',
    example: 'ABC-123',
  })
  @IsOptional()
  @IsString({ message: 'License plate must be a string' })
  @MaxLength(20, { message: 'License plate cannot exceed 20 characters' })
  license_plate?: string;

  @ApiPropertyOptional({
    description: 'Profile image URL',
    example: 'https://example.com/images/profile.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Profile image URL must be a valid URL' })
  profile_image_url?: string;
}

/**
 * DTO for order assignment to rider
 */
export class OrderAssignmentDto {
  @ApiProperty({
    description: 'Order ID to assign',
    example: 101,
  })
  @IsInt()
  @IsPositive()
  order_id: number;

  @ApiProperty({
    description: 'Order details/description',
    example: 'Burger and Fries delivery',
  })
  @IsString()
  @IsNotEmpty()
  order_description: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'Jane Smith',
  })
  @IsString()
  @IsNotEmpty()
  customer_name: string;

  @ApiProperty({
    description: 'Delivery address',
    example: '123 Main St, City, State',
  })
  @IsString()
  @IsNotEmpty()
  delivery_address: string;

  @ApiProperty({
    description: 'Order priority (1-5, where 5 is highest)',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;
}
