import { Module } from '@nestjs/common';
import { RiderGateway } from './rider.gateway';
import { DispatchGateway } from './dispatch.gateway';
import { ConnectionManagerService } from './connection-manager.service';
import { ProximityService } from '../shared/services/proximity.service';
import { OrderProximityService } from '../order/order-proximity.service';
import { KnexService } from '../database/knex.service';

@Module({
  providers: [
    ConnectionManagerService, 
    RiderGateway, 
    DispatchGateway,
    ProximityService,
    OrderProximityService,
    KnexService,
  ],
  exports: [
    ConnectionManagerService, 
    RiderGateway, 
    DispatchGateway,
    ProximityService,
    OrderProximityService,
  ],
})
export class WebSocketsModule {}
