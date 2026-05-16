import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTourShowDto } from './dto/create-tour-show.dto';
import { UpdateTourShowDto } from './dto/update-tour-show.dto';
import { QueryTourShowDto } from './dto/query-tour-show.dto';
import { TourShow } from '@prisma/client';

@Injectable()
export class TourShowsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryTourShowDto): Promise<TourShow[]> {
    const where: any = {};

    if (query.ticketStatus) {
      where.ticketStatus = query.ticketStatus;
    }

    if (query.upcoming) {
      where.showDate = { gte: new Date() };
    }

    return this.prisma.tourShow.findMany({
      where,
      orderBy: { showDate: 'asc' },
    });
  }

  async findOne(id: string): Promise<TourShow> {
    const tourShow = await this.prisma.tourShow.findUnique({
      where: { id },
    });

    if (!tourShow) {
      throw new NotFoundException(`TourShow with ID "${id}" not found`);
    }

    return tourShow;
  }

  async create(dto: CreateTourShowDto): Promise<TourShow> {
    return this.prisma.tourShow.create({
      data: {
        city: dto.city,
        country: dto.country,
        venueName: dto.venueName,
        showDate: new Date(dto.showDate),
        ticketStatus: dto.ticketStatus,
        ticketUrl: dto.ticketUrl ?? null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateTourShowDto): Promise<TourShow> {
    const tourShow = await this.prisma.tourShow.findUnique({
      where: { id },
    });

    if (!tourShow) {
      throw new NotFoundException(`TourShow with ID "${id}" not found`);
    }

    return this.prisma.tourShow.update({
      where: { id },
      data: {
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.venueName !== undefined && { venueName: dto.venueName }),
        ...(dto.showDate !== undefined && {
          showDate: new Date(dto.showDate),
        }),
        ...(dto.ticketStatus !== undefined && {
          ticketStatus: dto.ticketStatus,
        }),
        ...(dto.ticketUrl !== undefined && { ticketUrl: dto.ticketUrl }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
      },
    });
  }

  async remove(id: string): Promise<TourShow> {
    const tourShow = await this.prisma.tourShow.findUnique({
      where: { id },
    });

    if (!tourShow) {
      throw new NotFoundException(`TourShow with ID "${id}" not found`);
    }

    return this.prisma.tourShow.delete({ where: { id } });
  }
}
