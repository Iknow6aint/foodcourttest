import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('calculated_orders', (table) => {
    table.integer('service_charge').defaultTo(0);
    table.jsonb('meals').nullable(); // Store meals array as JSON
    table.string('cokitchen_polygon_id').nullable();
    table.integer('user_id').nullable();
    table.string('cokitchen_id').nullable();
    table.boolean('pickup').defaultTo(false);
    table.integer('prev_price').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('calculated_orders', (table) => {
    table.dropColumn('service_charge');
    table.dropColumn('meals');
    table.dropColumn('cokitchen_polygon_id');
    table.dropColumn('user_id');
    table.dropColumn('cokitchen_id');
    table.dropColumn('pickup');
    table.dropColumn('prev_price');
  });
}
