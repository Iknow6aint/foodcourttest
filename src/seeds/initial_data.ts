import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    // Clear existing data in reverse order of dependencies
    await knex("logs").del();
    await knex("order_amount_history").del();
    await knex("orders").del();
    await knex("calculated_orders").del();
    await knex("order_types").del();

    // Insert order types
    const [orderType] = await knex("order_types").insert({
        name: "CARD",
        created_at: new Date(),
        updated_at: new Date()
    }).returning('*');

    // Insert calculated order with meals data
    const [calculatedOrder] = await knex("calculated_orders").insert({
        total_amount: 26785,
        free_delivery: false,
        delivery_fee: 900,
        service_charge: 0,
        address_details: JSON.stringify({
            city: "Lekki",
            name: "Current",
            address_line: "Lekki, Lagos, Nigeria",
            building_number: "No."
        }),
        meals: JSON.stringify([
            {
                brand: {
                    id: "1",
                    name: "Jollof & Co."
                },
                meals: [
                    {
                        id: "m1",
                        name: "Pepper Rice Special",
                        brand: {
                            id: "1",
                            name: "Jollof & Co."
                        },
                        active: true,
                        amount: "1550",
                        quantity: 2,
                        description: "White rice wrapped in banana leaves served with special pepper stew"
                    },
                    {
                        id: "m2",
                        name: "Jollof Rice Combo",
                        brand: {
                            id: "1",
                            name: "Jollof & Co."
                        },
                        active: true,
                        amount: "2000",
                        quantity: 1,
                        description: "Classic jollof rice with chicken"
                    }
                ],
                amount: 5100,
                internal_profit: 0
            }
        ]),
        lat: 6.453235649711961,
        lng: 3.542877760780109,
        cokitchen_polygon_id: "s2",
        user_id: 2,
        cokitchen_id: "3",
        pickup: false,
        prev_price: 15030,
        created_at: new Date(),
        updated_at: new Date()
    }).returning('*');

    // Insert order
    const [order] = await knex("orders").insert({
        user_id: 5,
        completed: true,
        cancelled: false,
        kitchen_cancelled: false,
        kitchen_accepted: true,
        kitchen_dispatched: true,
        kitchen_dispatched_time: new Date('2023-05-17T10:38:26.190Z'),
        completed_time: new Date('2023-05-17T11:04:38.450Z'),
        rider_id: 2,
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
        updated_at: new Date('2023-05-17T11:04:38.454Z')
    }).returning('*');

    // Insert logs
    await knex("logs").insert([
        {
            order_id: order.id,
            time: new Date('2023-05-17T09:47:30.455Z'),
            description: 'Order received in kitchen'
        },
        {
            order_id: order.id,
            time: new Date('2023-05-17T09:47:47.716Z'),
            description: 'Order accepted by kitchen'
        },
        {
            order_id: order.id,
            time: new Date('2023-05-17T10:32:32.907Z'),
            description: 'Order completed by kitchen'
        },
        {
            order_id: order.id,
            time: new Date('2023-05-17T10:38:26.190Z'),
            description: 'Order dispatched by front desk'
        },
        {
            order_id: order.id,
            time: new Date('2023-05-17T11:04:38.448Z'),
            description: 'Trip Completed By Rider(James)'
        }
    ]);

    // Insert order amount history
    await knex("order_amount_history").insert({
        order_id: order.id,
        time: new Date('2023-05-17T09:47:30.302Z'),
        total_amount: 26785
    });

    console.log('Sample data seeded successfully');
};
