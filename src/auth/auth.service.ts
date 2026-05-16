import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Role } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string;
  username: string;
  email: string;
  role: Role;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<AuthTokensResponse> {
    const user = await this.findUserByIdentifier(dto.usernameOrEmail);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async register(dto: RegisterDto) {
    // Check for duplicate username or email
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }],
      },
    });

    if (existingUser) {
      if (existingUser.username === dto.username) {
        throw new ConflictException('Username is already taken');
      }
      throw new ConflictException('Email is already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: passwordHash,
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async refresh(
    dto: RefreshTokenDto,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    let payload: { sub: string };

    try {
      payload = this.jwtService.verify<{ sub: string }>(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.refreshToken !== dto.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateAccessToken(user);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  private async findUserByIdentifier(identifier: string) {
    if (identifier.includes('@')) {
      return this.prisma.user.findUnique({ where: { email: identifier } });
    }
    return this.prisma.user.findUnique({ where: { username: identifier } });
  }

  private async generateTokens(user: {
    id: string;
    username: string;
    email: string;
    role: Role;
  }): Promise<AuthTokensResponse> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const accessExpiresStr = process.env.JWT_ACCESS_EXPIRES || '15m';
    const refreshExpiresStr = process.env.JWT_REFRESH_EXPIRES || '7d';
    const accessExpiresSeconds = this.parseExpiresIn(accessExpiresStr);
    const refreshExpiresSeconds = this.parseExpiresIn(refreshExpiresStr);

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: accessExpiresSeconds,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: refreshExpiresSeconds,
      },
    );

    // Store refresh token in DB for revocation capability
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresSeconds,
    };
  }

  private async generateAccessToken(user: {
    id: string;
    username: string;
    email: string;
    role: Role;
  }): Promise<{ accessToken: string; expiresIn: number }> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const accessExpiresStr = process.env.JWT_ACCESS_EXPIRES || '15m';
    const accessExpiresSeconds = this.parseExpiresIn(accessExpiresStr);

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: accessExpiresSeconds,
    });

    return {
      accessToken,
      expiresIn: accessExpiresSeconds,
    };
  }

  private parseExpiresIn(expires: string): number {
    const match = expires.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

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
        return 900;
    }
  }
}
