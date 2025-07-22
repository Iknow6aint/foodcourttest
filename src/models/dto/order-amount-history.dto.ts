import { ApiProperty } from '@nestjs/swagger';

export class OrderAmountHistoryDto {
  @ApiProperty({
    description: 'Timestamp of the amount change',
    example: '2025-07-22T10:30:00.000Z',
  })
  time: Date;

  @ApiProperty({
    description: 'Total amount at this point in time',
    example: 26785,
  })
  total_amount: number;
}
