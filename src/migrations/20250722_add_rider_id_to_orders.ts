import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Since riders table needs to exist first, we'll update the orders table
  // to add the rider_id foreign key reference
  return knex.schema.alterTable('orders', (table) => {
    table.integer('rider_id').unsigned().nullable().references('id').inTable('riders').onDelete('SET NULL');
    table.index(['rider_id'], 'idx_orders_rider_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('orders', (table) => {
    table.dropIndex(['rider_id'], 'idx_orders_rider_id');
    table.dropColumn('rider_id');
  });
}
