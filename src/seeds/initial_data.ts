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
  const [calculatedOrder] = await knex('calculated_orders')
    .insert({
      total_amount: 26785,
      free_delivery: false,
      delivery_fee: 900,
      service_charge: 0,
      address_details: JSON.stringify({
        city: 'Lekki',
        name: 'Current',
        address_line: 'Lekki, Lagos, Nigeria',
        building_number: 'No.',
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
            {
              id: 'm2',
              name: 'Jollof Rice Combo',
              brand: {
                id: '1',
                name: 'Jollof & Co.',
              },
              active: true,
              amount: '2000',
              quantity: 1,
              description: 'Classic jollof rice with chicken',
            },
          ],
          amount: 5100,
          internal_profit: 0,
        },
      ]),
      lat: 6.453235649711961,
      lng: 3.542877760780109,
      cokitchen_polygon_id: 's2',
      user_id: 2,
      cokitchen_id: '3',
      pickup: false,
      prev_price: 15030,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning('*');

  // Insert sample riders
  const riders = await knex('riders')
    .insert([
      {
        name: 'James Wilson',
        email: 'james.wilson@fooddelivery.com',
        phone: '+2348123456789',
        password_hash: '$2b$10$example.hash.for.password123', // In real app, properly hash passwords
        is_available: true,
        is_active: true,
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
        is_available: false,
        is_active: true,
        current_latitude: 6.463235649711961,
        current_longitude: 3.552877760780109,
        last_location_update: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
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
        current_latitude: 6.443235649711961,
        current_longitude: 3.532877760780109,
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
        current_latitude: 6.473235649711961,
        current_longitude: 3.562877760780109,
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
        is_available: false,
        is_active: false, // Inactive rider
        current_latitude: null,
        current_longitude: null,
        last_location_update: null,
        vehicle_type: 'car',
        license_plate: 'LAG-004-DA',
        profile_image_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
    .returning('*');

  // Insert order
  const [order] = await knex('orders')
    .insert({
      user_id: 5,
      completed: true,
      cancelled: false,
      kitchen_cancelled: false,
      kitchen_accepted: true,
      kitchen_dispatched: true,
      kitchen_dispatched_time: new Date('2023-05-17T10:38:26.190Z'),
      completed_time: new Date('2023-05-17T11:04:38.450Z'),
      rider_id: riders[0].id, // Reference the first rider (James Wilson)
      kitchen_prepared: true,
      rider_assigned: true,
      paid: true,
      order_code: 'backend1001',
      calculated_order_id: calculatedOrder.id,
      order_type_id: orderType.id,
      kitchen_verified_time: new Date('2023-05-17T09:47:30.455Z'),
      kitchen_completed_time: new Date('2023-05-17T10:32:32.907Z'),
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
      created_at: new Date('2023-05-17T09:47:30.455Z'),
      updated_at: new Date('2023-05-17T11:04:38.454Z'),
    })
    .returning('*');

  // Insert logs
  await knex('logs').insert([
    {
      order_id: order.id,
      time: new Date('2023-05-17T09:47:30.455Z'),
      description: 'Order received in kitchen',
    },
    {
      order_id: order.id,
      time: new Date('2023-05-17T09:47:47.716Z'),
      description: 'Order accepted by kitchen',
    },
    {
      order_id: order.id,
      time: new Date('2023-05-17T10:32:32.907Z'),
      description: 'Order completed by kitchen',
    },
    {
      order_id: order.id,
      time: new Date('2023-05-17T10:38:26.190Z'),
      description: 'Order dispatched by front desk',
    },
    {
      order_id: order.id,
      time: new Date('2023-05-17T11:04:38.448Z'),
      description: 'Trip Completed By Rider(James)',
    },
  ]);

  // Insert order amount history
  await knex('order_amount_history').insert({
    order_id: order.id,
    time: new Date('2023-05-17T09:47:30.302Z'),
    total_amount: 26785,
  });

  console.log('Sample data seeded successfully');
}
