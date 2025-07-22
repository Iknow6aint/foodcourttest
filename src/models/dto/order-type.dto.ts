import { ApiProperty } from '@nestjs/swagger';

export class OrderTypeDto {
  @ApiProperty({
    description: 'Unique identifier for the order type',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Name of the order type',
    example: 'CARD',
  })
  name: string;

  @ApiProperty({
    description: 'Timestamp when the order type was created',
    example: '2025-07-22T10:30:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the order type was last updated',
    example: '2025-07-22T10:30:00.000Z',
  })
  updated_at: Date;
}
