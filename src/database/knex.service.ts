// src/database/knex.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import knex, { Knex } from 'knex';
import knexConfig from '../../knexfile';

@Injectable()
export class KnexService implements OnModuleInit, OnModuleDestroy {
  public knex: Knex;

  onModuleInit() {
    this.knex = knex(knexConfig.development);
  }

  onModuleDestroy() {
    if (this.knex) {
      this.knex.destroy();
    }
  }

  getKnex(): Knex {
    return this.knex;
  }
}
