import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { OrderResponseDto } from '../dto/order-response.dto';
import { MostBoughtMealResponseDto } from '../dto/most-bought-meal-response.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all orders with details',
    description:
      'Retrieves all orders along with their related data including logs, calculated order details, order type, and amount history using raw SQL queries.',
  })
  @ApiOkResponse({
    description: 'Successfully retrieved all orders with complete details',
    type: [OrderResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'No orders found in the database',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error occurred while fetching orders',
  })
  async getAllOrdersWithDetails(): Promise<OrderResponseDto[]> {
    return this.orderService.getAllOrdersWithDetails();
  }

  @Get('most-bought-meal')
  @ApiOperation({
    summary: 'Get the most bought meal',
    description:
      'Finds the meal with the highest total quantity ordered by analyzing the meals data in calculated orders using raw SQL queries.',
  })
  @ApiOkResponse({
    description: 'Successfully found the most bought meal',
    type: MostBoughtMealResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No completed orders with meals found',
  })
  @ApiResponse({
    status: 500,
    description:
      'Internal server error occurred while finding most bought meal',
  })
  async getMostBoughtMeal(): Promise<MostBoughtMealResponseDto> {
    return this.orderService.getMostBoughtMeal();
  }
}
