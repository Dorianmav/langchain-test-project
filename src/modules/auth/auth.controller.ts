import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import { AuthService, AuthResponse } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get JWT token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto.username, loginDto.password);
  }
}
