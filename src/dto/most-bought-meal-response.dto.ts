import { ApiProperty } from '@nestjs/swagger';

export class MostBoughtMealResponseDto {
  @ApiProperty({
    description: 'Name of the most bought meal',
    example: 'Pepper Rice Special',
  })
  name: string;

  @ApiProperty({
    description: 'Total quantity of this meal that has been bought',
    example: 15,
  })
  total_quantity: number;
}
