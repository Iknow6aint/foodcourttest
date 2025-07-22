import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderService } from './order/order.service';
import { RiderService } from './services/rider.service';
import { DispatchService } from './services/dispatch.service';
import { ProximityService } from './services/proximity.service';
import { OrderProximityService } from './order/order-proximity.service';
import { OrderController } from './controllers/order.controller';
import { RiderController } from './controllers/rider.controller';
import { DispatchController } from './controllers/dispatch.controller';
import { RabbitMQController } from './rabbitmq/rabbitmq.controller';
import { KnexService } from './database/knex.service';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';
import { WebSocketsModule } from './websockets/websockets.module';

@Module({
  imports: [WebSocketsModule],
  controllers: [
    AppController,
    OrderController,
    RiderController,
    DispatchController,
    RabbitMQController,
  ],
  providers: [
    AppService,
    OrderService,
    RiderService,
    DispatchService,
    ProximityService,
    OrderProximityService,
    KnexService,
    RabbitMQService,
  ],
  exports: [
    OrderService,
    RiderService, 
    DispatchService,
    ProximityService,
    OrderProximityService,
    KnexService,
    RabbitMQService,
  ],
})
export class AppModule {}
