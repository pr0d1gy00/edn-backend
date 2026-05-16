import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { Guest, Episode } from '@prisma/client';

@Injectable()
export class GuestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Guest[]> {
    return this.prisma.guest.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<Guest & { episodes: Episode[] }> {
    const guest = await this.prisma.guest.findUnique({
      where: { id },
      include: { episodes: true },
    });

    if (!guest) {
      throw new NotFoundException(`Guest with ID "${id}" not found`);
    }

    return guest;
  }

  async create(dto: CreateGuestDto): Promise<Guest> {
    return this.prisma.guest.create({
      data: {
        name: dto.name,
        bio: dto.bio ?? null,
        twitterHandle: dto.twitterHandle ?? null,
        instagramHandle: dto.instagramHandle ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateGuestDto): Promise<Guest> {
    const guest = await this.prisma.guest.findUnique({ where: { id } });

    if (!guest) {
      throw new NotFoundException(`Guest with ID "${id}" not found`);
    }

    return this.prisma.guest.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.twitterHandle !== undefined && {
          twitterHandle: dto.twitterHandle,
        }),
        ...(dto.instagramHandle !== undefined && {
          instagramHandle: dto.instagramHandle,
        }),
      },
    });
  }

  async remove(id: string): Promise<Guest> {
    const guest = await this.prisma.guest.findUnique({ where: { id } });

    if (!guest) {
      throw new NotFoundException(`Guest with ID "${id}" not found`);
    }

    return this.prisma.guest.delete({ where: { id } });
  }
}
