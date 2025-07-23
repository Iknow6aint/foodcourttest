import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { KnexService } from '../database/knex.service';
import {
  Rider,
  isValidCoordinates,
} from '../models/rider.model';
import {
  RiderLocationUpdateDto,
  RiderAvailabilityUpdateDto,
  RiderProfileUpdateDto,
} from '../models/dto/rider.dto';
import {
  RiderPublicProfileDto,
  RiderLocationDto,
  LocationUpdateResponseDto,
  ApiResponseDto,
} from '../models/dto/rider-response.dto';
import { ConnectionManagerService } from '../websockets/connection-manager.service';
import { LocationUpdateMessageDto } from '../models/dto/websocket-message.dto';

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
      const riderResult = await this.knex.raw(`
        SELECT 
          id, name, email, phone, is_available, vehicle_type, 
          profile_image_url, created_at
        FROM riders 
        WHERE id = ? AND is_active = true 
        LIMIT 1
      `, [riderId]);

      const rider = riderResult.rows[0];

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

    try {
      // Check if rider exists and is active using raw SQL
      const riderCheckResult = await this.knex.raw(`
        SELECT id, name, is_active 
        FROM riders 
        WHERE id = ? AND is_active = true 
        LIMIT 1
      `, [riderId]);

      const rider = riderCheckResult.rows[0];

      if (!rider) {
        throw new NotFoundException(
          `Rider with ID ${riderId} not found or inactive`,
        );
      }

      // Update location data using raw SQL
      await this.knex.raw(`
        UPDATE riders 
        SET 
          current_latitude = ?, 
          current_longitude = ?, 
          last_location_update = NOW()
        WHERE id = ?
      `, [current_latitude, current_longitude, riderId]);

      // Fetch updated rider data using raw SQL
      const updatedRiderResult = await this.knex.raw(`
        SELECT 
          id, name, current_latitude, current_longitude, 
          last_location_update, is_available
        FROM riders 
        WHERE id = ? 
        LIMIT 1
      `, [riderId]);

      const updatedRider = updatedRiderResult.rows[0];

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
      // Check if rider exists and is active using raw SQL
      const riderCheckResult = await this.knex.raw(`
        SELECT id, name, is_active 
        FROM riders 
        WHERE id = ? AND is_active = true 
        LIMIT 1
      `, [riderId]);

      const rider = riderCheckResult.rows[0];

      if (!rider) {
        throw new NotFoundException(
          `Rider with ID ${riderId} not found or inactive`,
        );
      }

      // Update availability using raw SQL
      await this.knex.raw(`
        UPDATE riders 
        SET is_available = ?, updated_at = NOW() 
        WHERE id = ?
      `, [availabilityData.is_available, riderId]);

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
      // Check if rider exists and is active using raw SQL
      const riderCheckResult = await this.knex.raw(`
        SELECT id, name, is_active 
        FROM riders 
        WHERE id = ? AND is_active = true 
        LIMIT 1
      `, [riderId]);

      const rider = riderCheckResult.rows[0];

      if (!rider) {
        throw new NotFoundException(
          `Rider with ID ${riderId} not found or inactive`,
        );
      }

      // Build dynamic update query based on provided fields
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (profileData.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(profileData.name);
      }
      if (profileData.phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(profileData.phone);
      }
      if (profileData.vehicle_type !== undefined) {
        updateFields.push('vehicle_type = ?');
        updateValues.push(profileData.vehicle_type);
      }
      if (profileData.profile_image_url !== undefined) {
        updateFields.push('profile_image_url = ?');
        updateValues.push(profileData.profile_image_url);
      }

      // Always update the updated_at field
      updateFields.push('updated_at = NOW()');
      updateValues.push(riderId); // For WHERE clause

      if (updateFields.length > 1) { // More than just updated_at
        const updateQuery = `
          UPDATE riders 
          SET ${updateFields.join(', ')} 
          WHERE id = ?
        `;
        await this.knex.raw(updateQuery, updateValues);
      }

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
      const riderResult = await this.knex.raw(`
        SELECT 
          id, name, current_latitude, current_longitude, 
          last_location_update, is_available
        FROM riders 
        WHERE id = ? AND is_active = true 
        LIMIT 1
      `, [riderId]);

      const rider = riderResult.rows[0];

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
      const riderResult = await this.knex.raw(`
        SELECT id 
        FROM riders 
        WHERE id = ? AND is_active = true 
        LIMIT 1
      `, [riderId]);

      const rider = riderResult.rows[0];
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
