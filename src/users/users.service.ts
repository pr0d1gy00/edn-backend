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

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
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
