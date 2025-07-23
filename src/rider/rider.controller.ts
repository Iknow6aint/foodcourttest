import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiSecurity,
} from '@nestjs/swagger';
import { RiderService } from '../rider/rider.service';
import { RiderAuthGuard, CurrentRider } from '../auth/rider-auth.guard';
import {
  RiderLocationUpdateDto,
  RiderAvailabilityUpdateDto,
  RiderProfileUpdateDto,
} from '../models/dto/rider.dto';
import {
  RiderPublicProfileDto,
  LocationUpdateResponseDto,
  ApiResponseDto,
} from '../models/dto/rider-response.dto';
import {
  ValidationErrorResponseDto,
  UnauthorizedErrorResponseDto,
  NotFoundErrorResponseDto,
} from '../models/dto/error-response.dto';
import { SwaggerExamples } from '../models/dto/swagger-examples';

@ApiTags('Riders')
@ApiSecurity('rider-auth')
@Controller('api/riders')
@UseGuards(RiderAuthGuard)
@ApiHeader({
  name: 'x-rider-id',
  description: 'Rider ID for authentication (e.g., 1, 2, 3)',
  required: true,
  example: '1',
})
export class RiderController {
  private readonly logger = new Logger(RiderController.name);

  constructor(private readonly riderService: RiderService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get rider profile',
    description: 'Retrieve the authenticated rider profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'Rider profile retrieved successfully',
    type: RiderPublicProfileDto,
    example: SwaggerExamples.RIDER_PROFILE,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid rider authentication',
    type: UnauthorizedErrorResponseDto,
    example: SwaggerExamples.UNAUTHORIZED_ERROR,
  })
  @ApiResponse({
    status: 404,
    description: 'Rider not found or inactive',
    type: NotFoundErrorResponseDto,
    example: SwaggerExamples.NOT_FOUND_ERROR,
  })
  async getRiderProfile(
    @CurrentRider() riderId: number,
  ): Promise<RiderPublicProfileDto> {
    this.logger.log(`Fetching profile for rider ${riderId}`);
    return this.riderService.getRiderProfile(riderId);
  }

  @Put('me/location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update rider location',
    description:
      'Update the current GPS coordinates of the authenticated rider',
  })
  @ApiResponse({
    status: 200,
    description: 'Location updated successfully',
    type: LocationUpdateResponseDto,
    example: SwaggerExamples.LOCATION_UPDATE_RESPONSE,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid coordinates or validation errors',
    type: ValidationErrorResponseDto,
    example: SwaggerExamples.COORDINATE_VALIDATION_ERROR,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid rider authentication',
    type: UnauthorizedErrorResponseDto,
    example: SwaggerExamples.UNAUTHORIZED_ERROR,
  })
  @ApiResponse({
    status: 404,
    description: 'Rider not found or inactive',
    type: NotFoundErrorResponseDto,
    example: SwaggerExamples.NOT_FOUND_ERROR,
  })
  async updateLocation(
    @CurrentRider() riderId: number,
    @Body() locationData: RiderLocationUpdateDto,
  ): Promise<LocationUpdateResponseDto> {
    this.logger.log(
      `Updating location for rider ${riderId}: (${locationData.current_latitude}, ${locationData.current_longitude})`,
    );
    return this.riderService.updateRiderLocation(riderId, locationData);
  }

  @Patch('me/availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Toggle rider availability',
    description: 'Update the availability status of the authenticated rider',
  })
  @ApiResponse({
    status: 200,
    description: 'Availability updated successfully',
    type: ApiResponseDto,
    example: SwaggerExamples.AVAILABILITY_UPDATE_RESPONSE,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid availability data',
    type: ValidationErrorResponseDto,
    example: SwaggerExamples.VALIDATION_ERROR,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid rider authentication',
    type: UnauthorizedErrorResponseDto,
    example: SwaggerExamples.UNAUTHORIZED_ERROR,
  })
  @ApiResponse({
    status: 404,
    description: 'Rider not found or inactive',
    type: NotFoundErrorResponseDto,
    example: SwaggerExamples.NOT_FOUND_ERROR,
  })
  async updateAvailability(
    @CurrentRider() riderId: number,
    @Body() availabilityData: RiderAvailabilityUpdateDto,
  ): Promise<ApiResponseDto<RiderPublicProfileDto>> {
    this.logger.log(
      `Updating availability for rider ${riderId}: ${availabilityData.is_available}`,
    );
    return this.riderService.updateRiderAvailability(riderId, availabilityData);
  }

  @Patch('me/profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update rider profile',
    description: 'Update profile information of the authenticated rider',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: ApiResponseDto,
    example: SwaggerExamples.AVAILABILITY_UPDATE_RESPONSE,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid profile data',
    type: ValidationErrorResponseDto,
    example: SwaggerExamples.VALIDATION_ERROR,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid rider authentication',
    type: UnauthorizedErrorResponseDto,
    example: SwaggerExamples.UNAUTHORIZED_ERROR,
  })
  @ApiResponse({
    status: 404,
    description: 'Rider not found or inactive',
    type: NotFoundErrorResponseDto,
    example: SwaggerExamples.NOT_FOUND_ERROR,
  })
  async updateProfile(
    @CurrentRider() riderId: number,
    @Body() profileData: RiderProfileUpdateDto,
  ): Promise<ApiResponseDto<RiderPublicProfileDto>> {
    this.logger.log(`Updating profile for rider ${riderId}`);
    return this.riderService.updateRiderProfile(riderId, profileData);
  }

  @Get('me/location')
  @ApiOperation({
    summary: 'Get rider current location',
    description: 'Retrieve the current location of the authenticated rider',
  })
  @ApiResponse({
    status: 200,
    description: 'Location retrieved successfully',
    example: SwaggerExamples.CURRENT_LOCATION,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid rider authentication',
    type: UnauthorizedErrorResponseDto,
    example: SwaggerExamples.UNAUTHORIZED_ERROR,
  })
  @ApiResponse({
    status: 404,
    description: 'Rider not found or inactive',
    type: NotFoundErrorResponseDto,
    example: SwaggerExamples.NOT_FOUND_ERROR,
  })
  async getRiderLocation(@CurrentRider() riderId: number) {
    this.logger.log(`Fetching location for rider ${riderId}`);
    return this.riderService.getRiderLocation(riderId);
  }
}
