import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderService } from './services/order.service';
import { OrderController } from './controllers/order.controller';
import { KnexService } from './database/knex.service';

@Module({
  imports: [],
  controllers: [AppController, OrderController],
  providers: [AppService, OrderService, KnexService],
  exports: [OrderService, KnexService],
})
export class AppModule {}
