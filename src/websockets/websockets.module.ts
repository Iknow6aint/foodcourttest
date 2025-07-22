import { Module } from '@nestjs/common';
import { RiderGateway } from './rider.gateway';
import { DispatchGateway } from './dispatch.gateway';
import { ConnectionManagerService } from './connection-manager.service';

@Module({
  providers: [ConnectionManagerService, RiderGateway, DispatchGateway],
  exports: [ConnectionManagerService, RiderGateway, DispatchGateway],
})
export class WebSocketsModule {}
