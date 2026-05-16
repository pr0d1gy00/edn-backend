import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EpisodesService } from '../episodes/episodes.service';
import { CreateInsideJokeDto } from './dto/create-inside-joke.dto';
import { UpdateInsideJokeDto } from './dto/update-inside-joke.dto';
import { QueryInsideJokeDto } from './dto/query-inside-joke.dto';
import { InsideJoke, Prisma } from '@prisma/client';

@Injectable()
export class InsideJokesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly episodesService: EpisodesService,
  ) {}

  async create(dto: CreateInsideJokeDto): Promise<InsideJoke> {
    // FK validation: throws NotFoundException if episode doesn't exist
    await this.episodesService.findOne(dto.episodeId);

    return this.prisma.insideJoke.create({
      data: {
        episodeId: dto.episodeId,
        startTimeStamp: dto.startTimeStamp,
        endTimeStamp: dto.endTimeStamp,
        keyConcept: dto.keyConcept,
        transcriptContext: dto.transcriptContext,
      },
    });
  }

  async findOne(id: string): Promise<InsideJoke> {
    const insideJoke = await this.prisma.insideJoke.findUnique({
      where: { id },
    });

    if (!insideJoke) {
      throw new NotFoundException(`InsideJoke with ID "${id}" not found`);
    }

    return insideJoke;
  }

  async findAll(query: QueryInsideJokeDto): Promise<InsideJoke[]> {
    const where: Prisma.InsideJokeWhereInput = {};

    if (query.episodeId) {
      where.episodeId = query.episodeId;
    }

    if (query.keyConcept) {
      where.keyConcept = {
        contains: query.keyConcept,
        mode: 'insensitive',
      };
    }

    return this.prisma.insideJoke.findMany({
      where,
      orderBy: { startTimeStamp: 'asc' },
    });
  }

  async update(id: string, dto: UpdateInsideJokeDto): Promise<InsideJoke> {
    const insideJoke = await this.prisma.insideJoke.findUnique({
      where: { id },
    });

    if (!insideJoke) {
      throw new NotFoundException(`InsideJoke with ID "${id}" not found`);
    }

    return this.prisma.insideJoke.update({
      where: { id },
      data: {
        ...(dto.startTimeStamp !== undefined && {
          startTimeStamp: dto.startTimeStamp,
        }),
        ...(dto.endTimeStamp !== undefined && {
          endTimeStamp: dto.endTimeStamp,
        }),
        ...(dto.keyConcept !== undefined && {
          keyConcept: dto.keyConcept,
        }),
        ...(dto.transcriptContext !== undefined && {
          transcriptContext: dto.transcriptContext,
        }),
      },
    });
  }

  async remove(id: string): Promise<InsideJoke> {
    const insideJoke = await this.prisma.insideJoke.findUnique({
      where: { id },
    });

    if (!insideJoke) {
      throw new NotFoundException(`InsideJoke with ID "${id}" not found`);
    }

    return this.prisma.insideJoke.delete({ where: { id } });
  }
}
