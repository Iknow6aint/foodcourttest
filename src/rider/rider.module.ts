import { Module } from '@nestjs/common';
import { RiderService } from './rider.service';
import { RiderController } from './rider.controller';
import { RiderAuthService } from './rider-auth.service';
import { RiderAuthController } from './rider-auth.controller';
import { KnexService } from '../database/knex.service';
import { ConnectionManagerService } from '../websockets/connection-manager.service';

@Module({
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
