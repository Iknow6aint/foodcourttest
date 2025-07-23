import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { RiderAuthService } from '../rider/rider-auth.service';

/**
 * JWT-based rider authentication guard
 * Validates rider tokens and extracts rider ID
 */
@Injectable()
export class RiderAuthGuard implements CanActivate {
  constructor(private readonly riderAuthService: RiderAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Validate token and get rider ID
      const riderId = await this.riderAuthService.validateToken(token);
      
      if (!riderId) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Attach rider ID to request for use in controllers
      request['riderId'] = riderId;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}

/**
 * Custom decorator to extract rider ID from request
 */
import { createParamDecorator } from '@nestjs/common';

export const CurrentRider = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.riderId;
  },
);
