import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Simple rider authentication guard
 * For demonstration purposes - in production, use proper JWT authentication
 */
@Injectable()
export class RiderAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Simple header-based authentication for demo
    const riderId = request.headers['x-rider-id'];

    if (!riderId || isNaN(Number(riderId))) {
      throw new UnauthorizedException('Valid rider authentication required');
    }

    // Attach rider ID to request for use in controllers
    request['riderId'] = Number(riderId);

    return true;
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
