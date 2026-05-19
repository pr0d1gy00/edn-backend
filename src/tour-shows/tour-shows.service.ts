import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { CreateTourShowDto } from './dto/create-tour-show.dto';
import { UpdateTourShowDto } from './dto/update-tour-show.dto';
import { QueryTourShowDto } from './dto/query-tour-show.dto';
import { TourShow, Media } from '@prisma/client';

export interface PaginatedTourShows {
  data: (TourShow & { images: Media[] })[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class TourShowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  async findAll(query: QueryTourShowDto): Promise<PaginatedTourShows> {
    const where: any = {};

    if (query.ticketStatus) {
      where.ticketStatus = query.ticketStatus;
    }

    if (query.upcoming) {
      where.showDate = { gte: new Date() };
    }

    if (query.search) {
      where.OR = [
        { city: { contains: query.search, mode: 'insensitive' } },
        { country: { contains: query.search, mode: 'insensitive' } },
        { venueName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [tourShows, total] = await Promise.all([
      this.prisma.tourShow.findMany({
        where,
        orderBy: { showDate: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.tourShow.count({ where }),
    ]);

    // Fetch images for all tour shows in one query
    const tourShowIds = tourShows.map((ts) => ts.id);
    const allImages = await this.media.findAllByEntityIds('TOUR_SHOW', tourShowIds);

    // Group images by tourShowId
    const imagesByTourShowId = allImages.reduce(
      (acc, img) => {
        if (!acc[img.entityId]) acc[img.entityId] = [];
        acc[img.entityId].push(img);
        return acc;
      },
      {} as Record<string, Media[]>,
    );

    // Attach images to each tour show
    const tourShowsWithImages = tourShows.map((ts) => ({
      ...ts,
      images: (imagesByTourShowId[ts.id] ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
    }));

    return {
      data: tourShowsWithImages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<TourShow & { images: Media[] }> {
    const tourShow = await this.prisma.tourShow.findUnique({
      where: { id },
    });

    if (!tourShow) {
      throw new NotFoundException(`TourShow with ID "${id}" not found`);
    }

    const images = await this.media.findByEntity('TOUR_SHOW', id);

    return {
      ...tourShow,
      images: images.sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }

  async create(dto: CreateTourShowDto): Promise<TourShow> {
    const tourShow = await this.prisma.tourShow.create({
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

    // Upload images if provided
    if (dto.files && dto.files.length > 0) {
      const sortOrders = dto.sortOrders ?? dto.files.map((_, i) => i);
      await this.uploadImages(tourShow.id, dto.files, sortOrders);
    }

    return tourShow;
  }

  async update(id: string, dto: UpdateTourShowDto): Promise<TourShow> {
    const tourShow = await this.prisma.tourShow.findUnique({
      where: { id },
    });

    if (!tourShow) {
      throw new NotFoundException(`TourShow with ID "${id}" not found`);
    }

    const updated = await this.prisma.tourShow.update({
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

    // Upload new images if provided
    if (dto.files && dto.files.length > 0) {
      const sortOrders = dto.sortOrders ?? dto.files.map((_, i) => i);
      await this.uploadImages(updated.id, dto.files, sortOrders);
    }

    return updated;
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

  private async uploadImages(
    tourShowId: string,
    files: Express.Multer.File[],
    sortOrders: number[],
  ): Promise<void> {
    const uploadPromises = files.map((file, index) =>
      this.media.upload(file, 'TOUR_SHOW', tourShowId, index === 0, sortOrders[index] ?? index),
    );
    await Promise.all(uploadPromises);
  }
}
