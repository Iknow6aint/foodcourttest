import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { VehicleType } from '../rider.model';

/**
 * DTO for rider signup
 */
export class SignupRiderDto {
  @ApiProperty({
    description: 'Full name of the rider',
    example: 'John Doe',
    minLength: 2,
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  @ApiProperty({
    description: 'Email address for the rider account',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Phone number with country code',
    example: '+2348123456789',
  })
  @IsString()
  @MinLength(10, { message: 'Phone number must be at least 10 characters' })
  phone: string;

  @ApiProperty({
    description: 'Password for the account',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    description: 'Type of vehicle used for delivery',
    enum: VehicleType,
    example: VehicleType.MOTORCYCLE,
    required: false,
  })
  @IsOptional()
  @IsEnum(VehicleType, { message: 'Invalid vehicle type' })
  vehicle_type?: VehicleType;

  @ApiProperty({
    description: 'Vehicle license plate number',
    example: 'LAG-123-ABC',
    required: false,
  })
  @IsOptional()
  @IsString()
  license_plate?: string;
}

/**
 * DTO for rider signin
 */
export class SigninRiderDto {
  @ApiProperty({
    description: 'Registered email address',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Account password',
    example: 'SecurePassword123!',
  })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}

/**
 * DTO for password change
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'OldPassword123!',
  })
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;
}
