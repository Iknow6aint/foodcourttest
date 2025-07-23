import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for token-only response (signin)
 */
export class TokenResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;
}

/**
 * DTO for token introspection response
 */
export class TokenIntrospectionDto {
  @ApiProperty({ description: 'Token is active', example: true })
  active: boolean;

  @ApiProperty({
    description: 'Rider unique identifier',
    example: 1,
    type: 'integer',
  })
  riderId: number;

  @ApiProperty({
    description: 'Rider email address',
    example: 'james.wilson@fooddelivery.com',
  })
  email: string;

  @ApiProperty({
    description: 'Rider full name',
    example: 'James Wilson',
  })
  name: string;

  @ApiProperty({
    description: 'Token issued at timestamp',
    example: 1642781234,
  })
  iat: number;

  @ApiProperty({
    description: 'Token expiration timestamp',
    example: 1642867634,
  })
  exp: number;
}
