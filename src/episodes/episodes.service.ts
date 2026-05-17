import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';
import { Episode, Guest } from '@prisma/client';

@Injectable()
export class EpisodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  async findAll(platformType?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [episodes, total] = await Promise.all([
      this.prisma.episode.findMany({
        where: platformType
          ? { platformType: platformType as any }
          : undefined,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        include: {
          guests: true,
          insideJokes: true,
        },
      }),
      this.prisma.episode.count({
        where: platformType
          ? { platformType: platformType as any }
          : undefined,
      }),
    ]);

    return {
      data: episodes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Episode & { guests: Guest[] }> {
    const episode = await this.prisma.episode.findUnique({
      where: { id },
      include: { guests: true },
    });

    if (!episode) {
      throw new NotFoundException(`Episode with ID "${id}" not found`);
    }

    return episode;
  }

  async create(dto: CreateEpisodeDto): Promise<Episode> {
    try {
      const episode = await this.prisma.episode.create({
        data: {
          title: dto.title,
          platformType: dto.platformType,
          contentUrl: dto.contentUrl,
          publishedAt: new Date(dto.publishedAt),
          episodeNumber: dto.episodeNumber ?? null,
          description: dto.description ?? null,
          thumbnailUrl: dto.thumbnailUrl ?? null,
          isExclusive: dto.isExclusive ?? false,
          durationSeconds: dto.durationSeconds ?? null,
        },
      });

      // Upload images if provided
      if (dto.files && dto.files.length > 0) {
        const sortOrders = dto.sortOrders ?? dto.files.map((_, i) => i);
        await this.uploadImages(episode.id, dto.files, sortOrders);
      }

      return episode;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const target = error.meta?.target as string[] | undefined;
        if (target?.includes('episode_number')) {
          throw new ConflictException(
            'An episode with this episode number already exists',
          );
        }
        throw new ConflictException('A unique constraint violation occurred');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateEpisodeDto): Promise<Episode> {
    const episode = await this.prisma.episode.findUnique({
      where: { id },
    });

    if (!episode) {
      throw new NotFoundException(`Episode with ID "${id}" not found`);
    }

    try {
      const updated = await this.prisma.episode.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.platformType !== undefined && {
            platformType: dto.platformType,
          }),
          ...(dto.contentUrl !== undefined && {
            contentUrl: dto.contentUrl,
          }),
          ...(dto.publishedAt !== undefined && {
            publishedAt: new Date(dto.publishedAt),
          }),
          ...(dto.episodeNumber !== undefined && {
            episodeNumber: dto.episodeNumber,
          }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.thumbnailUrl !== undefined && {
            thumbnailUrl: dto.thumbnailUrl,
          }),
          ...(dto.isExclusive !== undefined && {
            isExclusive: dto.isExclusive,
          }),
          ...(dto.durationSeconds !== undefined && {
            durationSeconds: dto.durationSeconds,
          }),
        },
      });

      // Upload new images if provided
      if (dto.files && dto.files.length > 0) {
        const sortOrders = dto.sortOrders ?? dto.files.map((_, i) => i);
        await this.uploadImages(updated.id, dto.files, sortOrders);
      }

      return updated;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const target = error.meta?.target as string[] | undefined;
        if (target?.includes('episode_number')) {
          throw new ConflictException(
            'An episode with this episode number already exists',
          );
        }
        throw new ConflictException('A unique constraint violation occurred');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<Episode> {
    const episode = await this.prisma.episode.findUnique({
      where: { id },
    });

    if (!episode) {
      throw new NotFoundException(`Episode with ID "${id}" not found`);
    }

    return this.prisma.episode.delete({ where: { id } });
  }

  async addGuest(
    episodeId: string,
    guestId: string,
  ): Promise<Episode & { guests: Guest[] }> {
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
    });

    if (!episode) {
      throw new NotFoundException(
        `Episode with ID "${episodeId}" not found`,
      );
    }

    const guest = await this.prisma.guest.findUnique({
      where: { id: guestId },
    });

    if (!guest) {
      throw new NotFoundException(`Guest with ID "${guestId}" not found`);
    }

    return this.prisma.episode.update({
      where: { id: episodeId },
      data: { guests: { connect: { id: guestId } } },
      include: { guests: true },
    });
  }

  async removeGuest(
    episodeId: string,
    guestId: string,
  ): Promise<Episode & { guests: Guest[] }> {
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
    });

    if (!episode) {
      throw new NotFoundException(
        `Episode with ID "${episodeId}" not found`,
      );
    }

    return this.prisma.episode.update({
      where: { id: episodeId },
      data: { guests: { disconnect: { id: guestId } } },
      include: { guests: true },
    });
  }

  async getGuests(episodeId: string): Promise<Guest[]> {
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
      include: { guests: true },
    });

    if (!episode) {
      throw new NotFoundException(
        `Episode with ID "${episodeId}" not found`,
      );
    }

    return episode.guests;
  }

  private async uploadImages(
    episodeId: string,
    files: Express.Multer.File[],
    sortOrders: number[],
  ): Promise<void> {
    const uploadPromises = files.map((file, index) =>
      this.media.upload(
        file,
        'EPISODE',
        episodeId,
        index === 0,
        sortOrders[index] ?? index,
      ),
    );
    await Promise.all(uploadPromises);
  }
}
