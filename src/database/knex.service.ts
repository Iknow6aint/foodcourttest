// src/database/knex.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import knex, { Knex } from 'knex';
import knexConfig from '../../knexfile';

@Injectable()
export class KnexService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KnexService.name);
  private knexInstance: Knex | null = null;

  async onModuleInit() {
    try {
      this.knexInstance = knex(knexConfig.development);
      // Test the connection
      await this.knexInstance.raw('SELECT 1');
      this.logger.log('Database connection established successfully');
    } catch (error) {
      this.logger.error('Failed to establish database connection', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.knexInstance) {
      await this.knexInstance.destroy();
      this.logger.log('Database connection closed');
    }
  }

  getKnex(): Knex {
    if (!this.knexInstance) {
      throw new Error('Database connection not initialized');
    }
    return this.knexInstance;
  }
}
