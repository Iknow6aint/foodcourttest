import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('orders', (table) => {
    // Kitchen related fields
    table.boolean('kitchen_cancelled').defaultTo(false);
    table.boolean('kitchen_accepted').defaultTo(false);
    table.boolean('kitchen_dispatched').defaultTo(false);
    table.timestamp('kitchen_dispatched_time').nullable();
    table.timestamp('completed_time').nullable();
    table.boolean('kitchen_prepared').defaultTo(false);
    table.timestamp('kitchen_verified_time').nullable();
    table.timestamp('kitchen_completed_time').nullable();
    table.boolean('shop_accepted').defaultTo(false);
    table.boolean('shop_prepared').defaultTo(false);

    // Rider related fields
    table.integer('rider_id').nullable();
    table.boolean('rider_assigned').defaultTo(false);
    table.timestamp('rider_started_time').nullable();
    table.boolean('rider_started').defaultTo(false);
    table.timestamp('rider_arrived_time').nullable();
    table.boolean('rider_arrived').defaultTo(false);

    // Delivery related fields
    table.integer('no_of_mealbags_delivered').defaultTo(0);
    table.integer('no_of_drinks_delivered').defaultTo(0);
    table.boolean('is_failed_trip').defaultTo(false);
    table.jsonb('failed_trip_details').nullable();
    table.string('box_number').nullable();
    table.integer('shelf_id').nullable();

    // Order management fields
    table.jsonb('order_change').nullable();
    table.boolean('scheduled').defaultTo(false);
    table.integer('confirmed_by_id').nullable();
    table.integer('completed_by_id').nullable();
    table.date('scheduled_delivery_date').nullable();
    table.time('scheduled_delivery_time').nullable();
    table.boolean('is_hidden').defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('orders', (table) => {
    table.dropColumn('kitchen_cancelled');
    table.dropColumn('kitchen_accepted');
    table.dropColumn('kitchen_dispatched');
    table.dropColumn('kitchen_dispatched_time');
    table.dropColumn('completed_time');
    table.dropColumn('kitchen_prepared');
    table.dropColumn('kitchen_verified_time');
    table.dropColumn('kitchen_completed_time');
    table.dropColumn('shop_accepted');
    table.dropColumn('shop_prepared');
    table.dropColumn('rider_id');
    table.dropColumn('rider_assigned');
    table.dropColumn('rider_started_time');
    table.dropColumn('rider_started');
    table.dropColumn('rider_arrived_time');
    table.dropColumn('rider_arrived');
    table.dropColumn('no_of_mealbags_delivered');
    table.dropColumn('no_of_drinks_delivered');
    table.dropColumn('is_failed_trip');
    table.dropColumn('failed_trip_details');
    table.dropColumn('box_number');
    table.dropColumn('shelf_id');
    table.dropColumn('order_change');
    table.dropColumn('scheduled');
    table.dropColumn('confirmed_by_id');
    table.dropColumn('completed_by_id');
    table.dropColumn('scheduled_delivery_date');
    table.dropColumn('scheduled_delivery_time');
    table.dropColumn('is_hidden');
  });
}
