import { ApiProperty } from '@nestjs/swagger';

export class LogDto {
  @ApiProperty({
    description: 'Timestamp when the log entry was created',
    example: '2025-07-22T10:30:00.000Z',
  })
  time: Date;

  @ApiProperty({
    description: 'Description of the log event',
    example: 'Order created successfully',
  })
  description: string;
}
