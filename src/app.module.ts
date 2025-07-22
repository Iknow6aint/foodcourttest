import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderService } from './services/order.service';
import { RiderService } from './services/rider.service';
import { DispatchService } from './services/dispatch.service';
import { OrderController } from './controllers/order.controller';
import { RiderController } from './controllers/rider.controller';
import { DispatchController } from './controllers/dispatch.controller';
import { RabbitMQController } from './controllers/rabbitmq.controller';
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
    KnexService,
    RabbitMQService,
  ],
  exports: [OrderService, RiderService, DispatchService, KnexService, RabbitMQService],
})
export class AppModule {}
