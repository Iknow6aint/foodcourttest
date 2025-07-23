import {
  Controller,
  Post,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiSecurity,
} from '@nestjs/swagger';
import { RiderAuthService } from './rider-auth.service';
import { RiderAuthGuard, CurrentRider } from '../auth/rider-auth.guard';
import {
  SignupRiderDto,
  SigninRiderDto,
  ChangePasswordDto,
} from '../models/dto/rider-auth.dto';
import { RiderAuthResponseDto } from '../models/dto/rider-response.dto';
import { TokenResponseDto, TokenIntrospectionDto } from '../models/dto/token-response.dto';
import {
  ValidationErrorResponseDto,
  ErrorResponseDto,
  UnauthorizedErrorResponseDto,
} from '../models/dto/error-response.dto';

@ApiTags('Rider Authentication')
@Controller('api/auth/riders')
export class RiderAuthController {
  private readonly logger = new Logger(RiderAuthController.name);

  constructor(private readonly riderAuthService: RiderAuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new rider',
    description: 'Create a new rider account with email and password',
  })
  @ApiResponse({
    status: 201,
    description: 'Rider registered successfully',
    type: RiderAuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation errors',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email or phone already registered',
    type: ErrorResponseDto,
  })
  async signup(@Body() signupData: SignupRiderDto): Promise<RiderAuthResponseDto> {
    this.logger.log(`New rider registration attempt: ${signupData.email}`);
    return this.riderAuthService.signup(signupData);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in rider',
    description: 'Authenticate rider with email and password',
  })
  @ApiResponse({
    status: 200,
    description: 'Sign in successful',
    type: RiderAuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation errors',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
    type: UnauthorizedErrorResponseDto,
  })
  async signin(@Body() signinData: SigninRiderDto): Promise<RiderAuthResponseDto> {
    this.logger.log(`Rider sign in attempt: ${signinData.email}`);
    return this.riderAuthService.signin(signinData);
  }

  @Post('signin-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rider sign in - token only',
    description: 'Authenticate rider and return only the access token',
  })
  @ApiResponse({
    status: 200,
    description: 'Sign in successful - token returned',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation errors',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
    type: UnauthorizedErrorResponseDto,
  })
  async signinToken(@Body() signinData: SigninRiderDto): Promise<TokenResponseDto> {
    this.logger.log(`Rider token sign in attempt: ${signinData.email}`);
    return this.riderAuthService.signinTokenOnly(signinData);
  }

  @Post('introspect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Token introspection',
    description: 'Get information about a JWT token',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token to introspect',
    required: true,
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiResponse({
    status: 200,
    description: 'Token introspection successful',
    type: TokenIntrospectionDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Missing or invalid token',
    type: ErrorResponseDto,
  })
  async introspectToken(@Headers('authorization') authHeader: string): Promise<TokenIntrospectionDto> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { active: false } as TokenIntrospectionDto;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    this.logger.log('Token introspection request');
    return this.riderAuthService.introspectToken(token);
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RiderAuthGuard)
  @ApiSecurity('rider-auth')
  @ApiHeader({
    name: 'x-rider-id',
    description: 'Rider ID for authentication',
    required: true,
    example: '1',
  })
  @ApiOperation({
    summary: 'Change rider password',
    description: 'Change the password for the authenticated rider',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Password changed successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation errors',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials or rider ID',
    type: UnauthorizedErrorResponseDto,
  })
  async changePassword(
    @CurrentRider() riderId: number,
    @Body() changePasswordData: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Password change request for rider ${riderId}`);
    return this.riderAuthService.changePassword(
      riderId,
      changePasswordData.currentPassword,
      changePasswordData.newPassword,
    );
  }
}
