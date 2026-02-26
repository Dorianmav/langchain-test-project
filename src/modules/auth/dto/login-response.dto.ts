import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Type of token',
    example: 'Bearer',
  })
  token_type: string;

  @ApiProperty({
    description: 'Token expiration in seconds',
    example: 86400,
  })
  expires_in: number;
}
