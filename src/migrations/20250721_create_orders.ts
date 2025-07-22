import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.boolean('completed').defaultTo(false);
    table.boolean('cancelled').defaultTo(false);
    table.boolean('paid').defaultTo(false);
    table.string('order_code');
    table
      .integer('calculated_order_id')
      .unsigned()
      .references('id')
      .inTable('calculated_orders')
      .onDelete('SET NULL');
    table
      .integer('order_type_id')
      .unsigned()
      .references('id')
      .inTable('order_types')
      .onDelete('SET NULL');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('orders');
}
