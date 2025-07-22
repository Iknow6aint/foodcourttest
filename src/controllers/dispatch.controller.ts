import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { DispatchService } from '../services/dispatch.service';
import { OrderAssignmentDto } from '../dto/rider.dto';
import { ApiResponseDto } from '../dto/rider-response.dto';
import {
  ValidationErrorResponseDto,
  NotFoundErrorResponseDto,
} from '../dto/error-response.dto';
import { SwaggerExamples } from '../dto/swagger-examples';

@ApiTags('Dispatch')
@Controller('api/dispatch')
export class DispatchController {
  private readonly logger = new Logger(DispatchController.name);

  constructor(private readonly dispatchService: DispatchService) {}

  /**
   * Assign order to rider via API (also broadcasts via WebSocket)
   */
  @Post('riders/:riderId/assign-order')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign order to rider',
    description:
      'Assigns an order to a specific rider and broadcasts the assignment via WebSocket to real-time clients',
  })
  @ApiParam({
    name: 'riderId',
    description: 'Rider ID to assign order to',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Order assigned successfully',
    type: ApiResponseDto,
    examples: SwaggerExamples.orderAssignmentSuccess,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
    type: ValidationErrorResponseDto,
    examples: SwaggerExamples.validationError,
  })
  @ApiResponse({
    status: 404,
    description: 'Rider not found',
    type: NotFoundErrorResponseDto,
    examples: SwaggerExamples.notFoundError,
  })
  async assignOrderToRider(
    @Param('riderId', ParseIntPipe) riderId: number,
    @Body() orderData: OrderAssignmentDto,
  ): Promise<ApiResponseDto<any>> {
    this.logger.log(
      `Assigning order ${orderData.order_id} to rider ${riderId}`,
    );

    const result = await this.dispatchService.assignOrderToRider(
      riderId,
      orderData,
    );

    this.logger.log(
      `Order ${orderData.order_id} assigned to rider ${riderId} successfully`,
    );

    return {
      success: true,
      message: 'Order assigned successfully',
      data: result,
      timestamp: new Date(),
    };
  }

  /**
   * Get all connected riders
   */
  @Post('riders/list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get list of connected riders',
    description: 'Returns a list of all currently connected riders',
  })
  @ApiResponse({
    status: 200,
    description: 'Connected riders retrieved successfully',
    type: ApiResponseDto,
  })
  async getConnectedRiders(): Promise<ApiResponseDto<any>> {
    const riders = await this.dispatchService.getConnectedRiders();

    return {
      success: true,
      message: 'Connected riders retrieved successfully',
      data: {
        riders,
        totalConnected: riders.length,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Get system statistics
   */
  @Post('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get dispatch system statistics',
    description: 'Returns system statistics for the dispatch dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: ApiResponseDto,
  })
  async getSystemStats(): Promise<ApiResponseDto<any>> {
    const stats = await this.dispatchService.getSystemStats();

    return {
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats,
      timestamp: new Date(),
    };
  }
}
