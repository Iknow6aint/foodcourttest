import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { KnexService } from '../database/knex.service';
import { SignupRiderDto, SigninRiderDto } from '../models/dto/rider-auth.dto';
import { RiderAuthResponseDto } from '../models/dto/rider-response.dto';
import { TokenResponseDto, TokenIntrospectionDto } from '../models/dto/token-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RiderAuthService {
  private readonly logger = new Logger(RiderAuthService.name);
  private readonly saltRounds = 10;
  private readonly jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  private readonly jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';

  constructor(
    private readonly knexService: KnexService,
    private readonly jwtService: JwtService,
  ) {}

  private get knex() {
    return this.knexService.getKnex();
  }

  /**
   * Register a new rider
   */
  async signup(signupData: SignupRiderDto): Promise<RiderAuthResponseDto> {
    const { name, email, phone, password, vehicle_type, license_plate } = signupData;

    try {
      // Check if rider already exists using raw SQL
      const existingRiderResult = await this.knex.raw(`
        SELECT id, email, phone 
        FROM riders 
        WHERE email = ? OR phone = ?
        LIMIT 1
      `, [email, phone]);

      const existingRider = existingRiderResult.rows[0];

      if (existingRider) {
        if (existingRider.email === email) {
          throw new ConflictException('Email already registered');
        }
        if (existingRider.phone === phone) {
          throw new ConflictException('Phone number already registered');
        }
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, this.saltRounds);

      // Create new rider using raw SQL
      const newRiderResult = await this.knex.raw(`
        INSERT INTO riders (
          name, email, phone, password_hash, vehicle_type, license_plate,
          is_available, is_active, created_at, updated_at
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        RETURNING id, name, email, phone, is_available, vehicle_type, created_at
      `, [
        name,
        email,
        phone,
        password_hash,
        vehicle_type || null,
        license_plate || null,
        false, // Default to unavailable
        true
      ]);

      const newRider = newRiderResult.rows[0];

      this.logger.log(`New rider registered: ${newRider.email} (ID: ${newRider.id})`);

      // Generate JWT token
      const payload = {
        riderId: newRider.id,
        email: newRider.email,
        name: newRider.name,
        iat: Math.floor(Date.now() / 1000),
      };

      const token = this.jwtService.sign(payload, {
        secret: this.jwtSecret,
        expiresIn: this.jwtExpiresIn,
      });

      this.logger.log(`Rider signed up successfully: ${newRider.email}`);
      return {
        success: true,
        message: 'Rider registered successfully',
        data: {
          rider: {
            id: newRider.id,
            name: newRider.name,
            email: newRider.email,
            phone: newRider.phone,
            vehicle_type: newRider.vehicle_type,
            is_available: newRider.is_available,
            profile_image_url: null,
            created_at: newRider.created_at,
          },
          token,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error during rider signup: ${error.message}`, error.stack);
      
      if (error instanceof ConflictException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to register rider');
    }
  }

  /**
   * Authenticate rider login - token only response
   */
  async signinTokenOnly(signinData: SigninRiderDto): Promise<TokenResponseDto> {
    const { email, password } = signinData;

    try {
      // Find rider by email using raw SQL
      const riderResult = await this.knex.raw(`
        SELECT 
          id, name, email, password_hash, is_active
        FROM riders 
        WHERE email = ? 
        LIMIT 1
      `, [email]);

      const rider = riderResult.rows[0];

      if (!rider) {
        throw new UnauthorizedException('Invalid email or password');
      }

      if (!rider.is_active) {
        throw new UnauthorizedException('Account is deactivated. Contact support.');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, rider.password_hash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Update last login timestamp using raw SQL
      await this.knex.raw(`
        UPDATE riders 
        SET updated_at = NOW() 
        WHERE id = ?
      `, [rider.id]);

      // Generate JWT token
      const payload = {
        riderId: rider.id,
        email: rider.email,
        name: rider.name,
        iat: Math.floor(Date.now() / 1000),
      };

      const token = this.jwtService.sign(payload, {
        secret: this.jwtSecret,
        expiresIn: this.jwtExpiresIn,
      });

      this.logger.log(`Rider signed in: ${rider.email} (ID: ${rider.id})`);

      return {
        access_token: token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error during rider signin: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to sign in rider');
    }
  }

  /**
   * Token introspection - get token details
   */
  async introspectToken(token: string): Promise<TokenIntrospectionDto> {
    try {
      // Verify JWT token
      const payload = this.jwtService.verify(token, {
        secret: this.jwtSecret,
      });

      if (!payload || !payload.riderId) {
        return { active: false } as TokenIntrospectionDto;
      }

      const riderId = payload.riderId;
        
      // Verify rider exists and is active using raw SQL
      const riderResult = await this.knex.raw(`
        SELECT id 
        FROM riders 
        WHERE id = ? AND is_active = true 
        LIMIT 1
      `, [riderId]);
        
      const rider = riderResult.rows[0];
      
      if (!rider) {
        return { active: false } as TokenIntrospectionDto;
      }

      return {
        active: true,
        riderId: payload.riderId,
        email: payload.email,
        name: payload.name,
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (error) {
      this.logger.error(`Error during token introspection: ${error.message}`);
      return { active: false } as TokenIntrospectionDto;
    }
  }

  /**
   * Authenticate rider login
   */
  async signin(signinData: SigninRiderDto): Promise<RiderAuthResponseDto> {
    const { email, password } = signinData;

    try {
      // Find rider by email using raw SQL
      const riderResult = await this.knex.raw(`
        SELECT 
          id, name, email, phone, password_hash, is_available, 
          is_active, vehicle_type, created_at
        FROM riders 
        WHERE email = ? 
        LIMIT 1
      `, [email]);

      const rider = riderResult.rows[0];

      if (!rider) {
        throw new UnauthorizedException('Invalid email or password');
      }

      if (!rider.is_active) {
        throw new UnauthorizedException('Account is deactivated. Contact support.');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, rider.password_hash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Update last login timestamp using raw SQL
      await this.knex.raw(`
        UPDATE riders 
        SET updated_at = NOW() 
        WHERE id = ?
      `, [rider.id]);

      // Remove password_hash from response
      const { password_hash, ...riderData } = rider;

      // Generate JWT token
      const payload = {
        riderId: rider.id,
        email: rider.email,
        name: rider.name,
        iat: Math.floor(Date.now() / 1000),
      };

      const token = this.jwtService.sign(payload, {
        secret: this.jwtSecret,
        expiresIn: this.jwtExpiresIn,
      });

      this.logger.log(`Rider signed in: ${rider.email} (ID: ${rider.id})`);

      return {
        success: true,
        message: 'Sign in successful',
        data: {
          rider: {
            id: rider.id,
            name: rider.name,
            email: rider.email,
            phone: rider.phone,
            vehicle_type: rider.vehicle_type,
            is_available: rider.is_available,
            profile_image_url: null,
            created_at: rider.created_at,
          },
          token,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error during rider signin: ${error.message}`, error.stack);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to sign in');
    }
  }

  /**
   * Validate rider JWT token
   */
  async validateToken(token: string): Promise<number | null> {
    try {
      // Verify JWT token
      const payload = this.jwtService.verify(token, {
        secret: this.jwtSecret,
      });

      if (!payload || !payload.riderId) {
        return null;
      }

      const riderId = payload.riderId;
        
      // Verify rider exists and is active using raw SQL
      const riderResult = await this.knex.raw(`
        SELECT id 
        FROM riders 
        WHERE id = ? AND is_active = true 
        LIMIT 1
      `, [riderId]);
        
      const rider = riderResult.rows[0];
      return rider ? rider.id : null;
    } catch (error) {
      this.logger.error(`Error validating token: ${error.message}`);
      return null;
    }
  }

  /**
   * Change rider password
   */
  async changePassword(
    riderId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get rider password hash using raw SQL
      const riderResult = await this.knex.raw(`
        SELECT password_hash 
        FROM riders 
        WHERE id = ? AND is_active = true 
        LIMIT 1
      `, [riderId]);

      const rider = riderResult.rows[0];

      if (!rider) {
        throw new UnauthorizedException('Rider not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        rider.password_hash,
      );
      
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);

      // Update password using raw SQL
      await this.knex.raw(`
        UPDATE riders 
        SET password_hash = ?, updated_at = NOW() 
        WHERE id = ?
      `, [newPasswordHash, riderId]);

      this.logger.log(`Password changed for rider ID: ${riderId}`);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      this.logger.error(`Error changing password: ${error.message}`, error.stack);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to change password');
    }
  }
}
