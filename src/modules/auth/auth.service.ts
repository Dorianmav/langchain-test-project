import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable()
export class AuthService {
  private readonly users = new Map<string, { username: string; password: string }>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // Utilisateur par défaut (à remplacer par une vraie base de données)
    this.initDefaultUser();
  }

  private async initDefaultUser() {
    const defaultUsername = this.configService.get<string>('API_USERNAME') || 'admin';
    const defaultPassword = this.configService.get<string>('API_PASSWORD') || 'changeme';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    this.users.set(defaultUsername, {
      username: defaultUsername,
      password: hashedPassword,
    });
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = this.users.get(username);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const user = await this.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.username,
      username: user.username,
    };

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '24h';
    const expiresInSeconds = this.parseExpiresIn(expiresIn);

    return {
      access_token: this.jwtService.sign(payload),
      token_type: 'Bearer',
      expires_in: expiresInSeconds,
    };
  }

  async validateToken(payload: JwtPayload): Promise<any> {
    const user = this.users.get(payload.username);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    const { password: _, ...result } = user;
    return result;
  }

  private parseExpiresIn(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 86400; // Default to 24 hours
    }
  }
}
