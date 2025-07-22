import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderService } from './services/order.service';
import { RiderService } from './services/rider.service';
import { OrderController } from './controllers/order.controller';
import { RiderController } from './controllers/rider.controller';
import { RabbitMQController } from './controllers/rabbitmq.controller';
import { KnexService } from './database/knex.service';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';

@Module({
  imports: [],
  controllers: [
    AppController,
    OrderController,
    RiderController,
    RabbitMQController,
  ],
  providers: [
    AppService,
    OrderService,
    RiderService,
    KnexService,
    RabbitMQService,
  ],
  exports: [OrderService, RiderService, KnexService, RabbitMQService],
})
export class AppModule {}
