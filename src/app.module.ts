import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderService } from './order/order.service';
import { DispatchService } from './shared/services/dispatch.service';
import { ProximityService } from './shared/services/proximity.service';
import { OrderProximityService } from './order/order-proximity.service';
import { OrderController } from './shared/controllers/order.controller';
import { DispatchController } from './shared/controllers/dispatch.controller';
import { RabbitMQController } from './rabbitmq/rabbitmq.controller';
import { KnexService } from './database/knex.service';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';
import { RiderService } from './rider/rider.service';
import { ConnectionManagerService } from './websockets/connection-manager.service';
import { WebSocketsModule } from './websockets/websockets.module';
import { RiderModule } from './rider/rider.module';

@Module({
  imports: [WebSocketsModule, RiderModule],
  controllers: [
    AppController,
    OrderController,
    DispatchController,
    RabbitMQController,
  ],
  providers: [
    AppService,
    OrderService,
    DispatchService,
    ProximityService,
    OrderProximityService,
    RiderService,
    ConnectionManagerService,
    KnexService,
    RabbitMQService,
  ],
  exports: [
    OrderService,
    DispatchService,
    ProximityService,
    OrderProximityService,
    KnexService,
    RabbitMQService,
  ],
})
export class AppModule {}
