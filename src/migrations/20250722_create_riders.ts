import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('riders', (table) => {
    // Primary key
    table.increments('id').primary();

    // Basic rider information
    table.string('name', 255).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('phone', 20).notNullable().unique();
    table.text('password_hash').notNullable(); // For authentication

    // Availability and status
    table.boolean('is_available').defaultTo(false).notNullable();
    table.boolean('is_active').defaultTo(true).notNullable(); // Account status

    // Location tracking (using decimal for precision)
    table.decimal('current_latitude', 10, 8).nullable(); // Precision: 10 digits, 8 after decimal
    table.decimal('current_longitude', 11, 8).nullable(); // Precision: 11 digits, 8 after decimal
    table.timestamp('last_location_update').nullable();

    // Additional rider details
    table.string('vehicle_type', 50).nullable(); // e.g., 'motorcycle', 'bicycle', 'car'
    table.string('license_plate', 20).nullable();
    table.text('profile_image_url').nullable();

    // Timestamps
    table.timestamps(true, true);

    // Indexes for performance
    table.index(
      ['is_available', 'current_latitude', 'current_longitude'],
      'idx_riders_availability_location',
    );
    table.index(['email'], 'idx_riders_email');
    table.index(['phone'], 'idx_riders_phone');
    table.index(['is_active'], 'idx_riders_active');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('riders');
}
