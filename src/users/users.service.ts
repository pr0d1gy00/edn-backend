import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';

export interface PaginatedUsers {
  data: Omit<User, 'password' | 'refreshToken'>[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<PaginatedUsers> {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { username: 'asc' },
        select: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async create(dto: CreateUserDto, callerRole?: string): Promise<User> {
    // If trying to create an ADMIN user, verify the caller is ADMIN
    if (dto.role === 'ADMIN' && callerRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Only administrators can create admin users',
      );
    }

    try {
      return await this.prisma.user.create({
        data: {
          username: dto.username,
          email: dto.email,
          avatarUrl: dto.avatarUrl,
          role: dto.role,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const target = error.meta?.target as string[] | undefined;
        if (target?.includes('username')) {
          throw new ConflictException('Username is already taken');
        }
        if (target?.includes('email')) {
          throw new ConflictException('Email is already taken');
        }
        throw new ConflictException('A unique constraint violation occurred');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...(dto.username !== undefined && { username: dto.username }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
          ...(dto.role !== undefined && { role: dto.role }),
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const target = error.meta?.target as string[] | undefined;
        if (target?.includes('username')) {
          throw new ConflictException('Username is already taken');
        }
        if (target?.includes('email')) {
          throw new ConflictException('Email is already taken');
        }
        throw new ConflictException('A unique constraint violation occurred');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return this.prisma.user.delete({ where: { id } });
  }
}
