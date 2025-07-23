import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DispatchService } from '../../shared/services/dispatch.service';
import { OrderProximityService } from '../../order/order-proximity.service';
import { OrderAssignmentDto } from '../../models/dto/rider.dto';
import { ApiResponseDto } from '../../models/dto/rider-response.dto';
import {
  ValidationErrorResponseDto,
  NotFoundErrorResponseDto,
} from '../../models/dto/error-response.dto';
import { SwaggerExamples } from '../../models/dto/swagger-examples';

@ApiTags('Dispatch')
@Controller('api/dispatch')
export class DispatchController {
  private readonly logger = new Logger(DispatchController.name);

  constructor(
    private readonly dispatchService: DispatchService,
    private readonly orderProximityService: OrderProximityService,
  ) {}

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

  /**
   * Test proximity search for a specific order
   */
  @Get('orders/:orderId/proximity-search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get proximity search results for order',
    description:
      'Find all available riders within 5km of the restaurant location for the specified order',
  })
  @ApiParam({
    name: 'orderId',
    description: 'Order ID to search nearby riders for',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Proximity search results retrieved successfully',
    type: ApiResponseDto,
  })
  async getOrderProximitySearch(
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    this.logger.log(`Getting proximity search results for order ${orderId}`);

    const result =
      await this.orderProximityService.getOrderProximityResults(orderId);

    if (!result) {
      return {
        success: false,
        message: 'Order not found or missing location data',
        data: null,
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      message: 'Proximity search completed successfully',
      data: {
        orderId: result.orderId,
        restaurantLocation: result.restaurantLocation,
        nearbyRiders: result.nearbyRiders,
        searchRadius: result.searchRadius,
        totalRidersFound: result.totalRidersFound,
        connectedRidersCount: result.connectedRidersCount,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Assign calculated order to rider (Alternative endpoint for frontend)
   */
  @Post('assign-order')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign calculated order to rider',
    description:
      'Assigns a calculated order to a specific rider and notifies them via WebSocket',
  })
  @ApiResponse({
    status: 200,
    description: 'Order assigned successfully',
    type: ApiResponseDto,
  })
  async assignCalculatedOrderToRider(
    @Body() assignmentData: { calculatedOrderId: number; riderId: number },
  ) {
    this.logger.log(
      `Assigning calculated order ${assignmentData.calculatedOrderId} to rider ${assignmentData.riderId}`,
    );

    try {
      // Create order assignment data in the format expected by dispatch service
      const orderData = {
        order_id: assignmentData.calculatedOrderId,
        order_description: 'Food delivery order',
        customer_name: 'Test Customer',
        delivery_address: 'Test Address',
        pickup_time: new Date().toISOString(),
        delivery_instructions: 'Handle with care',
      };

      const result = await this.dispatchService.assignOrderToRider(
        assignmentData.riderId,
        orderData,
      );

      return {
        success: true,
        message: 'Order assigned successfully',
        data: result,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error assigning order to rider:', error.message);

      return {
        success: false,
        message: error.message || 'Failed to assign order',
        data: null,
        timestamp: new Date(),
      };
    }
  }
}
