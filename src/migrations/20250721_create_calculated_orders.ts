import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('calculated_orders', (table) => {
    table.increments('id').primary();
    table.integer('total_amount').notNullable();
    table.boolean('free_delivery').defaultTo(false);
    table.integer('delivery_fee').defaultTo(0);
    table.jsonb('address_details'); // Store address as JSON
    table.decimal('lat', 10, 6);
    table.decimal('lng', 10, 6);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('calculated_orders');
}
