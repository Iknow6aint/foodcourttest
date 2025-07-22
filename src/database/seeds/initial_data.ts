import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data in reverse order of dependencies
  await knex('logs').del();
  await knex('order_amount_history').del();
  await knex('orders').del();
  await knex('calculated_orders').del();
  await knex('order_types').del();
  await knex('riders').del();

  // Insert order types
  const [orderType] = await knex('order_types')
    .insert({
      name: 'CARD',
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning('*');

  // Insert calculated order with meals data
  const calculatedOrders = await knex('calculated_orders')
    .insert([
      {
        total_amount: 26785,
        free_delivery: false,
        delivery_fee: 900,
        service_charge: 0,
        address_details: JSON.stringify({
          city: 'Lekki',
          name: 'Jollof & Co Restaurant',
          address_line: 'Lekki Phase 1, Lagos, Nigeria',
          building_number: '15A',
        }),
        meals: JSON.stringify([
          {
            brand: {
              id: '1',
              name: 'Jollof & Co.',
            },
            meals: [
              {
                id: 'm1',
                name: 'Pepper Rice Special',
                brand: {
                  id: '1',
                  name: 'Jollof & Co.',
                },
                active: true,
                amount: '1550',
                quantity: 2,
                description:
                  'White rice wrapped in banana leaves served with special pepper stew',
              },
            ],
            amount: 3100,
            internal_profit: 0,
          },
        ]),
        // Main restaurant location for proximity testing
        lat: 6.453235649711961,
        lng: 3.542877760780109,
        cokitchen_polygon_id: 's2',
        user_id: 2,
        cokitchen_id: '3',
        pickup: false,
        prev_price: 15030,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        total_amount: 18500,
        free_delivery: false,
        delivery_fee: 900,
        service_charge: 0,
        address_details: JSON.stringify({
          city: 'Victoria Island',
          name: 'Pizza Palace',
          address_line: 'Victoria Island, Lagos, Nigeria',
          building_number: '25B',
        }),
        meals: JSON.stringify([
          {
            brand: {
              id: '2',
              name: 'Pizza Palace',
            },
            meals: [
              {
                id: 'm3',
                name: 'Margherita Pizza',
                amount: '3500',
                quantity: 1,
              },
            ],
            amount: 3500,
          },
        ]),
        // Different location for testing multiple restaurants
        lat: 6.428876649711961,
        lng: 3.418877760780109,
        cokitchen_polygon_id: 's3',
        user_id: 3,
        cokitchen_id: '4',
        pickup: false,
        prev_price: 12000,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        total_amount: 15200,
        free_delivery: true,
        delivery_fee: 0,
        service_charge: 500,
        address_details: JSON.stringify({
          city: 'Ikeja',
          name: 'Burger Spot',
          address_line: 'Ikeja GRA, Lagos, Nigeria',
          building_number: '10C',
        }),
        meals: JSON.stringify([
          {
            brand: {
              id: '3',
              name: 'Burger Spot',
            },
            meals: [
              {
                id: 'm4',
                name: 'Classic Beef Burger',
                amount: '2800',
                quantity: 2,
              },
            ],
            amount: 5600,
          },
        ]),
        // Third location - no nearby riders scenario
        lat: 6.598876649711961,
        lng: 3.358877760780109,
        cokitchen_polygon_id: 's4',
        user_id: 4,
        cokitchen_id: '5',
        pickup: false,
        prev_price: 14000,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
    .returning('*');

  // Insert sample riders with strategic locations for proximity testing
  const riders = await knex('riders')
    .insert([
      {
        name: 'James Wilson',
        email: 'james.wilson@fooddelivery.com',
        phone: '+2348123456789',
        password_hash: '$2b$10$example.hash.for.password123',
        is_available: true,
        is_active: true,
        // VERY CLOSE to restaurant (same location) - ~0km
        current_latitude: 6.453235649711961,
        current_longitude: 3.542877760780109,
        last_location_update: new Date(),
        vehicle_type: 'motorcycle',
        license_plate: 'LAG-001-JW',
        profile_image_url: 'https://example.com/images/james-wilson.jpg',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@fooddelivery.com',
        phone: '+2348987654321',
        password_hash: '$2b$10$example.hash.for.password456',
        is_available: true, // Changed to available for testing
        is_active: true,
        // CLOSE to restaurant - ~1.5km away
        current_latitude: 6.463235649711961,
        current_longitude: 3.555877760780109,
        last_location_update: new Date(),
        vehicle_type: 'bicycle',
        license_plate: null,
        profile_image_url: 'https://example.com/images/sarah-johnson.jpg',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Michael Chen',
        email: 'michael.chen@fooddelivery.com',
        phone: '+2348555123456',
        password_hash: '$2b$10$example.hash.for.password789',
        is_available: true,
        is_active: true,
        // MEDIUM distance - ~3km away
        current_latitude: 6.430235649711961,
        current_longitude: 3.515877760780109,
        last_location_update: new Date(),
        vehicle_type: 'scooter',
        license_plate: 'LAG-002-MC',
        profile_image_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Amara Okafor',
        email: 'amara.okafor@fooddelivery.com',
        phone: '+2348111222333',
        password_hash: '$2b$10$example.hash.for.password012',
        is_available: true,
        is_active: true,
        // EDGE of 5km radius - ~4.8km away
        current_latitude: 6.403235649711961,
        current_longitude: 3.502877760780109,
        last_location_update: new Date(),
        vehicle_type: 'motorcycle',
        license_plate: 'LAG-003-AO',
        profile_image_url: 'https://example.com/images/amara-okafor.jpg',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'David Adebayo',
        email: 'david.adebayo@fooddelivery.com',
        phone: '+2348999888777',
        password_hash: '$2b$10$example.hash.for.password345',
        is_available: true, // Changed to available
        is_active: true, // Changed to active
        // FAR AWAY - ~8km away (should NOT appear in 5km search)
        current_latitude: 6.380235649711961,
        current_longitude: 3.475877760780109,
        last_location_update: new Date(),
        vehicle_type: 'car',
        license_plate: 'LAG-004-DA',
        profile_image_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Grace Enyeribe',
        email: 'grace.enyeribe@fooddelivery.com',
        phone: '+2348777666555',
        password_hash: '$2b$10$example.hash.for.password678',
        is_available: false, // UNAVAILABLE rider (should not appear in search)
        is_active: true,
        // Close but unavailable - ~2km away
        current_latitude: 6.440235649711961,
        current_longitude: 3.525877760780109,
        last_location_update: new Date(),
        vehicle_type: 'motorcycle',
        license_plate: 'LAG-005-GE',
        profile_image_url: 'https://example.com/images/grace-enyeribe.jpg',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Peter Okolie',
        email: 'peter.okolie@fooddelivery.com',
        phone: '+2348444333222',
        password_hash: '$2b$10$example.hash.for.password901',
        is_available: true,
        is_active: true,
        // JUST OUTSIDE 5km radius - ~6.2km away (should NOT appear)
        current_latitude: 6.395235649711961,
        current_longitude: 3.485877760780109,
        last_location_update: new Date(),
        vehicle_type: 'scooter',
        license_plate: 'LAG-006-PO',
        profile_image_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
    .returning('*');

  // Insert orders for different test scenarios
  const orders = await knex('orders')
    .insert([
      {
        user_id: 5,
        completed: false, // Active order for testing
        cancelled: false,
        kitchen_cancelled: false,
        kitchen_accepted: true,
        kitchen_dispatched: false,
        kitchen_dispatched_time: null,
        completed_time: null,
        rider_id: null, // No rider assigned yet - perfect for proximity search
        kitchen_prepared: true,
        rider_assigned: false,
        paid: true,
        order_code: 'PROX001',
        calculated_order_id: calculatedOrders[0].id, // Jollof & Co location
        order_type_id: orderType.id,
        kitchen_verified_time: new Date(),
        kitchen_completed_time: new Date(),
        shop_accepted: true,
        shop_prepared: true,
        no_of_mealbags_delivered: 0,
        no_of_drinks_delivered: 0,
        rider_started: false,
        rider_arrived: false,
        is_failed_trip: false,
        box_number: 'TABLE',
        scheduled: false,
        is_hidden: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 6,
        completed: false,
        cancelled: false,
        kitchen_cancelled: false,
        kitchen_accepted: true,
        kitchen_dispatched: false,
        kitchen_dispatched_time: null,
        completed_time: null,
        rider_id: null, // No rider assigned
        kitchen_prepared: true,
        rider_assigned: false,
        paid: true,
        order_code: 'PROX002',
        calculated_order_id: calculatedOrders[1].id, // Pizza Palace location
        order_type_id: orderType.id,
        kitchen_verified_time: new Date(),
        kitchen_completed_time: new Date(),
        shop_accepted: true,
        shop_prepared: true,
        no_of_mealbags_delivered: 0,
        no_of_drinks_delivered: 0,
        rider_started: false,
        rider_arrived: false,
        is_failed_trip: false,
        box_number: 'TABLE',
        scheduled: false,
        is_hidden: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 7,
        completed: false,
        cancelled: false,
        kitchen_cancelled: false,
        kitchen_accepted: true,
        kitchen_dispatched: false,
        kitchen_dispatched_time: null,
        completed_time: null,
        rider_id: null, // No rider assigned
        kitchen_prepared: true,
        rider_assigned: false,
        paid: true,
        order_code: 'PROX003',
        calculated_order_id: calculatedOrders[2].id, // Burger Spot location (no nearby riders)
        order_type_id: orderType.id,
        kitchen_verified_time: new Date(),
        kitchen_completed_time: new Date(),
        shop_accepted: true,
        shop_prepared: true,
        no_of_mealbags_delivered: 0,
        no_of_drinks_delivered: 0,
        rider_started: false,
        rider_arrived: false,
        is_failed_trip: false,
        box_number: 'TABLE',
        scheduled: false,
        is_hidden: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
    .returning('*');

  // Insert logs for first order only
  await knex('logs').insert([
    {
      order_id: orders[0].id,
      time: new Date(),
      description: 'Order received in kitchen',
    },
    {
      order_id: orders[0].id,
      time: new Date(),
      description: 'Order accepted by kitchen',
    },
    {
      order_id: orders[0].id,
      time: new Date(),
      description: 'Order completed by kitchen - ready for rider assignment',
    },
  ]);

  // Insert order amount history for first order
  await knex('order_amount_history').insert({
    order_id: orders[0].id,
    time: new Date(),
    total_amount: 26785,
  });

  console.log('✅ Sample data seeded successfully!');
  console.log('🎯 Test Scenarios Created:');
  console.log('   📍 Order #1 (Jollof & Co): Should find 4 riders within 5km');
  console.log('   📍 Order #2 (Pizza Palace): Should find different riders based on location');
  console.log('   📍 Order #3 (Burger Spot): Should find no riders (too far)');
  console.log('🏍️ Riders positioned at various distances from restaurants');
  console.log('   → James Wilson: ~0km (same location)');
  console.log('   → Sarah Johnson: ~1.5km away');
  console.log('   → Michael Chen: ~3km away');
  console.log('   → Amara Okafor: ~4.8km away (edge of range)');
  console.log('   → David Adebayo: ~8km away (should NOT appear)');
  console.log('   → Grace Enyeribe: ~2km but UNAVAILABLE (should NOT appear)');
  console.log('   → Peter Okolie: ~6.2km away (should NOT appear)');
  console.log('🧪 Ready for proximity search testing!');
}
