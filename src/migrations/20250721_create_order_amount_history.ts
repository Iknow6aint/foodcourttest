import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('order_amount_history', (table) => {
    table.increments('id').primary();
    table
      .integer('order_id')
      .unsigned()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');
    table.timestamp('time').notNullable();
    table.integer('total_amount').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('order_amount_history');
}
