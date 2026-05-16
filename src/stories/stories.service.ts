import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { CommunityStory } from '@prisma/client';

@Injectable()
export class StoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<CommunityStory[]> {
    return this.prisma.communityStory.findMany({
      where: { isApproved: true },
      include: {
        _count: { select: { votes: true } },
        user: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<CommunityStory> {
    const story = await this.prisma.communityStory.findUnique({
      where: { id },
      include: {
        _count: { select: { votes: true } },
        user: true,
      },
    });

    if (!story) {
      throw new NotFoundException(`Story with ID "${id}" not found`);
    }

    if (!story.isApproved) {
      throw new NotFoundException(`Story with ID "${id}" not found`);
    }

    return story;
  }

  async create(dto: CreateStoryDto): Promise<CommunityStory> {
    return this.prisma.communityStory.create({
      data: {
        title: dto.title,
        content: dto.content,
        category: dto.category ?? null,
        userId: dto.userId ?? null,
      },
      include: {
        _count: { select: { votes: true } },
        user: true,
      },
    });
  }

  async update(id: string, dto: UpdateStoryDto): Promise<CommunityStory> {
    const story = await this.prisma.communityStory.findUnique({
      where: { id },
    });

    if (!story) {
      throw new NotFoundException(`Story with ID "${id}" not found`);
    }

    return this.prisma.communityStory.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.category !== undefined && { category: dto.category }),
      },
      include: {
        _count: { select: { votes: true } },
        user: true,
      },
    });
  }

  async remove(id: string): Promise<CommunityStory> {
    const story = await this.prisma.communityStory.findUnique({
      where: { id },
    });

    if (!story) {
      throw new NotFoundException(`Story with ID "${id}" not found`);
    }

    return this.prisma.communityStory.delete({ where: { id } });
  }

  async approve(id: string): Promise<CommunityStory> {
    const story = await this.prisma.communityStory.findUnique({
      where: { id },
    });

    if (!story) {
      throw new NotFoundException(`Story with ID "${id}" not found`);
    }

    if (story.isApproved) {
      return story;
    }

    return this.prisma.communityStory.update({
      where: { id },
      data: { isApproved: true },
      include: {
        _count: { select: { votes: true } },
        user: true,
      },
    });
  }

  async reject(id: string): Promise<CommunityStory> {
    const story = await this.prisma.communityStory.findUnique({
      where: { id },
    });

    if (!story) {
      throw new NotFoundException(`Story with ID "${id}" not found`);
    }

    return this.prisma.communityStory.delete({ where: { id } });
  }
}
