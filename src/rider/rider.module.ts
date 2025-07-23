import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RiderService } from './rider.service';
import { RiderController } from './rider.controller';
import { RiderAuthService } from './rider-auth.service';
import { RiderAuthController } from './rider-auth.controller';
import { KnexService } from '../database/knex.service';
import { ConnectionManagerService } from '../websockets/connection-manager.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
    }),
  ],
  providers: [
    RiderService,
    RiderAuthService,
    KnexService,
    ConnectionManagerService,
  ],
  controllers: [RiderController, RiderAuthController],
  exports: [RiderService, RiderAuthService],
})
export class RiderModule {}
