import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { KnexService } from '../database/knex.service';
import {
  Rider,
  RiderLocationUpdate,
  UpdateRiderData,
  isValidCoordinates,
  getRiderStatus,
} from '../models/rider.model';
import {
  RiderLocationUpdateDto,
  RiderAvailabilityUpdateDto,
  RiderProfileUpdateDto,
} from '../dto/rider.dto';
import {
  RiderPublicProfileDto,
  RiderLocationDto,
  LocationUpdateResponseDto,
  ApiResponseDto,
} from '../dto/rider-response.dto';
import { ConnectionManagerService } from '../websockets/connection-manager.service';
import { LocationUpdateMessageDto } from '../dto/websocket-message.dto';

@Injectable()
export class RiderService {
  private readonly logger = new Logger(RiderService.name);

  constructor(
    private readonly knexService: KnexService,
    private readonly connectionManager: ConnectionManagerService,
  ) {}

  private get knex() {
    return this.knexService.getKnex();
  }

  /**
   * Get rider profile by ID
   */
  async getRiderProfile(riderId: number): Promise<RiderPublicProfileDto> {
    try {
      const rider = await this.knex('riders')
        .select([
          'id',
          'name',
          'email',
          'phone',
          'is_available',
          'vehicle_type',
          'profile_image_url',
          'created_at',
        ])
        .where('id', riderId)
        .andWhere('is_active', true)
        .first();

      if (!rider) {
        throw new NotFoundException(
          `Rider with ID ${riderId} not found or inactive`,
        );
      }

      return rider;
    } catch (error) {
      this.logger.error(
        `Error fetching rider profile: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch rider profile');
    }
  }

  /**
   * Update rider location with validation and transaction handling
   */
  async updateRiderLocation(
    riderId: number,
    locationData: RiderLocationUpdateDto,
  ): Promise<LocationUpdateResponseDto> {
    const { current_latitude, current_longitude } = locationData;

    // Validate coordinates
    if (!isValidCoordinates(current_latitude, current_longitude)) {
      throw new BadRequestException(
        'Invalid coordinates: Latitude must be between -90 and 90, longitude between -180 and 180',
      );
    }

    // Use transaction for data consistency
    const trx = await this.knex.transaction();

    try {
      // Check if rider exists and is active
      const rider = await trx('riders')
        .select('id', 'name', 'is_active')
        .where('id', riderId)
        .andWhere('is_active', true)
        .first();

      if (!rider) {
        throw new NotFoundException(
          `Rider with ID ${riderId} not found or inactive`,
        );
      }

      // Update location data
      const updateData: RiderLocationUpdate = {
        current_latitude,
        current_longitude,
        last_location_update: new Date(),
      };

      await trx('riders').where('id', riderId).update(updateData);

      // Fetch updated rider data
      const updatedRider = await trx('riders')
        .select([
          'id',
          'name',
          'current_latitude',
          'current_longitude',
          'last_location_update',
          'is_available',
        ])
        .where('id', riderId)
        .first();

      await trx.commit();

      // Broadcast location update to dispatch dashboards via WebSocket
      const locationMessage: LocationUpdateMessageDto = {
        type: 'location_update',
        data: {
          riderId,
          latitude: current_latitude,
          longitude: current_longitude,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        messageId: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      };

      this.connectionManager.broadcastLocationUpdate(locationMessage);

      this.logger.log(
        `Location updated for rider ${riderId}: (${current_latitude}, ${current_longitude})`,
      );

      return {
        success: true,
        message: 'Location updated successfully',
        data: updatedRider,
        timestamp: new Date(),
      };
    } catch (error) {
      await trx.rollback();
      this.logger.error(
        `Error updating rider location: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update rider location');
    }
  }

  /**
   * Update rider availability status
   */
  async updateRiderAvailability(
    riderId: number,
    availabilityData: RiderAvailabilityUpdateDto,
  ): Promise<ApiResponseDto<RiderPublicProfileDto>> {
    try {
      // Check if rider exists and is active
      const rider = await this.knex('riders')
        .select('id', 'name', 'is_active')
        .where('id', riderId)
        .andWhere('is_active', true)
        .first();

      if (!rider) {
        throw new NotFoundException(
          `Rider with ID ${riderId} not found or inactive`,
        );
      }

      // Update availability
      await this.knex('riders').where('id', riderId).update({
        is_available: availabilityData.is_available,
        updated_at: new Date(),
      });

      // Fetch updated profile
      const updatedProfile = await this.getRiderProfile(riderId);

      this.logger.log(
        `Availability updated for rider ${riderId}: ${availabilityData.is_available ? 'Available' : 'Unavailable'}`,
      );

      return {
        success: true,
        message: `Rider is now ${availabilityData.is_available ? 'available' : 'unavailable'}`,
        data: updatedProfile,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error updating rider availability: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update rider availability');
    }
  }

  /**
   * Update rider profile information
   */
  async updateRiderProfile(
    riderId: number,
    profileData: RiderProfileUpdateDto,
  ): Promise<ApiResponseDto<RiderPublicProfileDto>> {
    try {
      // Check if rider exists and is active
      const rider = await this.knex('riders')
        .select('id', 'name', 'is_active')
        .where('id', riderId)
        .andWhere('is_active', true)
        .first();

      if (!rider) {
        throw new NotFoundException(
          `Rider with ID ${riderId} not found or inactive`,
        );
      }

      // Prepare update data (only include provided fields)
      const updateData: UpdateRiderData = {
        ...profileData,
        updated_at: new Date(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // Update profile
      await this.knex('riders').where('id', riderId).update(updateData);

      // Fetch updated profile
      const updatedProfile = await this.getRiderProfile(riderId);

      this.logger.log(`Profile updated for rider ${riderId}`);

      return {
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error updating rider profile: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update rider profile');
    }
  }

  /**
   * Get rider location data
   */
  async getRiderLocation(riderId: number): Promise<RiderLocationDto> {
    try {
      const rider = await this.knex('riders')
        .select([
          'id',
          'name',
          'current_latitude',
          'current_longitude',
          'last_location_update',
          'is_available',
        ])
        .where('id', riderId)
        .andWhere('is_active', true)
        .first();

      if (!rider) {
        throw new NotFoundException(
          `Rider with ID ${riderId} not found or inactive`,
        );
      }

      return rider;
    } catch (error) {
      this.logger.error(
        `Error fetching rider location: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch rider location');
    }
  }

  /**
   * Validate rider exists and is active
   */
  async validateRiderExists(riderId: number): Promise<boolean> {
    try {
      const rider = await this.knex('riders')
        .select('id')
        .where('id', riderId)
        .andWhere('is_active', true)
        .first();

      return !!rider;
    } catch (error) {
      this.logger.error(
        `Error validating rider existence: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
