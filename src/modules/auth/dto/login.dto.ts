import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export { LoginResponseDto } from './login-response.dto';

export class LoginDto {
  @ApiProperty({
    description: 'Username',
    example: 'admin',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Password',
    example: 'changeme',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
