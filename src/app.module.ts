import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderService } from './services/order.service';
import { OrderController } from './controllers/order.controller';
import { RabbitMQController } from './controllers/rabbitmq.controller';
import { KnexService } from './database/knex.service';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';

@Module({
  imports: [],
  controllers: [AppController, OrderController, RabbitMQController],
  providers: [AppService, OrderService, KnexService, RabbitMQService],
  exports: [OrderService, KnexService, RabbitMQService],
})
export class AppModule {}
