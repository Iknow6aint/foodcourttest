import { ApiProperty } from '@nestjs/swagger';

export class MealDto {
  @ApiProperty({
    description: 'Unique identifier for the meal',
    example: 'm1',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the meal',
    example: 'Pepper Rice Special',
  })
  name: string;

  @ApiProperty({
    description: 'Meal description',
    example: 'White rice wrapped in banana leaves served with special pepper stew',
  })
  description: string;

  @ApiProperty({
    description: 'Price of the meal in smallest currency unit',
    example: '1550',
  })
  amount: string;

  @ApiProperty({
    description: 'Quantity ordered',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'Whether the meal is active',
    example: true,
  })
  active: boolean;

  @ApiProperty({
    description: 'Brand information',
    example: { id: '1', name: 'Jollof & Co.' },
  })
  brand: {
    id: string;
    name: string;
  };
}

export class MealGroupDto {
  @ApiProperty({
    description: 'Brand information for the meal group',
    example: { id: '1', name: 'Jollof & Co.' },
  })
  brand: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: 'Array of meals in this group',
    type: [MealDto],
  })
  meals: MealDto[];

  @ApiProperty({
    description: 'Total amount for this meal group',
    example: 5100,
  })
  amount: number;

  @ApiProperty({
    description: 'Internal profit for this meal group',
    example: 0,
  })
  internal_profit: number;
}

export class CalculatedOrderDto {
  @ApiProperty({
    description: 'Unique identifier for the calculated order',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Total amount for the order',
    example: 26785,
  })
  total_amount: number;

  @ApiProperty({
    description: 'Whether delivery is free',
    example: false,
  })
  free_delivery: boolean;

  @ApiProperty({
    description: 'Delivery fee amount',
    example: 900,
  })
  delivery_fee: number;

  @ApiProperty({
    description: 'Service charge amount',
    example: 0,
  })
  service_charge: number;

  @ApiProperty({
    description: 'Address details as JSON object',
    example: {
      city: 'Lekki',
      name: 'Current',
      address_line: 'Lekki, Lagos, Nigeria',
      building_number: 'No.',
    },
  })
  address_details: Record<string, any>;

  @ApiProperty({
    description: 'Array of meal groups ordered',
    type: [MealGroupDto],
  })
  meals: MealGroupDto[];

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 6.453235649711961,
  })
  lat: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 3.542877760780109,
  })
  lng: number;

  @ApiProperty({
    description: 'Kitchen polygon identifier',
    example: 's2',
  })
  cokitchen_polygon_id: string;

  @ApiProperty({
    description: 'User ID who placed the order',
    example: 2,
  })
  user_id: number;

  @ApiProperty({
    description: 'Kitchen identifier',
    example: '3',
  })
  cokitchen_id: string;

  @ApiProperty({
    description: 'Whether this is a pickup order',
    example: false,
  })
  pickup: boolean;

  @ApiProperty({
    description: 'Previous price before any changes',
    example: 15030,
  })
  prev_price: number;

  @ApiProperty({
    description: 'Timestamp when the calculated order was created',
    example: '2025-07-22T10:30:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the calculated order was last updated',
    example: '2025-07-22T10:30:00.000Z',
  })
  updated_at: Date;
}
