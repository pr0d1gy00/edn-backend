import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoryPromptDto } from './dto/create-story-prompt.dto';
import { UpdateStoryPromptDto } from './dto/update-story-prompt.dto';
import { StoryPrompt, Prisma } from '@prisma/client';

@Injectable()
export class StoryPromptsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns prompts that are currently open for story submissions.
   * A prompt is "open" when isOpen=true AND (closesAt is null OR closesAt is in the future).
   *
   * @param includeAll - If true (ADMIN), return all open prompts regardless of isPublic.
   *                     If false (PUBLIC), only return open prompts where isPublic=true.
   */
  async findOpen(includeAll: boolean = false): Promise<StoryPrompt[]> {
    const now = new Date();

    const where: Prisma.StoryPromptWhereInput = {
      isOpen: true,
      OR: [{ closesAt: null }, { closesAt: { gt: now } }],
    };

    if (!includeAll) {
      where.isPublic = true;
    }

    return this.prisma.storyPrompt.findMany({
      where,
      orderBy: { opensAt: 'desc' },
    });
  }

  /**
   * Returns prompts that are open for voting purposes — regardless of isPublic.
   * Used by StoriesService to validate prompt before creating a story.
   */
  async findOpenForVoting(): Promise<StoryPrompt[]> {
    const now = new Date();

    return this.prisma.storyPrompt.findMany({
      where: {
        isOpen: true,
        OR: [{ closesAt: null }, { closesAt: { gt: now } }],
      },
      orderBy: { opensAt: 'desc' },
    });
  }

  /**
   * ADMIN ONLY — returns all prompts regardless of open status.
   */
  async findAll(): Promise<StoryPrompt[]> {
    return this.prisma.storyPrompt.findMany({
      orderBy: { opensAt: 'desc' },
      include: {
        _count: { select: { stories: true } },
      },
    });
  }

  async findOne(id: string): Promise<StoryPrompt> {
    const prompt = await this.prisma.storyPrompt.findUnique({
      where: { id },
      include: {
        _count: { select: { stories: true } },
      },
    });

    if (!prompt) {
      throw new NotFoundException(`StoryPrompt with ID "${id}" not found`);
    }

    return prompt;
  }

  async create(dto: CreateStoryPromptDto): Promise<StoryPrompt> {
    this.validateClosesAt(dto.closesAt);

    return this.prisma.storyPrompt.create({
      data: {
        title: dto.title,
        description: dto.description,
        opensAt: dto.opensAt ? new Date(dto.opensAt) : null,
        closesAt: dto.closesAt ? new Date(dto.closesAt) : null,
        isPublic: dto.isPublic ?? false,
      },
    });
  }

  async update(id: string, dto: UpdateStoryPromptDto): Promise<StoryPrompt> {
    const prompt = await this.prisma.storyPrompt.findUnique({
      where: { id },
    });

    if (!prompt) {
      throw new NotFoundException(`StoryPrompt with ID "${id}" not found`);
    }

    if (dto.closesAt !== undefined) {
      this.validateClosesAt(dto.closesAt);
    }

    const data: Prisma.StoryPromptUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.isPublic !== undefined) data.isPublic = dto.isPublic;
    if (dto.opensAt !== undefined) {
      data.opensAt = dto.opensAt ? new Date(dto.opensAt) : null;
    }
    if (dto.closesAt !== undefined) {
      data.closesAt = dto.closesAt ? new Date(dto.closesAt) : null;
    }

    return this.prisma.storyPrompt.update({
      where: { id },
      data,
    });
  }

  async open(id: string): Promise<StoryPrompt> {
    const prompt = await this.prisma.storyPrompt.findUnique({
      where: { id },
    });

    if (!prompt) {
      throw new NotFoundException(`StoryPrompt with ID "${id}" not found`);
    }

    // Auto-close if closesAt has already passed
    if (prompt.closesAt && prompt.closesAt <= new Date()) {
      return this.prisma.storyPrompt.update({
        where: { id },
        data: { isOpen: false },
      });
    }

    return this.prisma.storyPrompt.update({
      where: { id },
      data: { isOpen: true },
    });
  }

  async close(id: string): Promise<StoryPrompt> {
    const prompt = await this.prisma.storyPrompt.findUnique({
      where: { id },
    });

    if (!prompt) {
      throw new NotFoundException(`StoryPrompt with ID "${id}" not found`);
    }

    return this.prisma.storyPrompt.update({
      where: { id },
      data: { isOpen: false },
    });
  }

  async publish(id: string): Promise<StoryPrompt> {
    const prompt = await this.prisma.storyPrompt.findUnique({
      where: { id },
    });

    if (!prompt) {
      throw new NotFoundException(`StoryPrompt with ID "${id}" not found`);
    }

    return this.prisma.storyPrompt.update({
      where: { id },
      data: { isPublic: true },
    });
  }

  async unpublish(id: string): Promise<StoryPrompt> {
    const prompt = await this.prisma.storyPrompt.findUnique({
      where: { id },
    });

    if (!prompt) {
      throw new NotFoundException(`StoryPrompt with ID "${id}" not found`);
    }

    return this.prisma.storyPrompt.update({
      where: { id },
      data: { isPublic: false },
    });
  }

  async remove(id: string): Promise<StoryPrompt> {
    const prompt = await this.prisma.storyPrompt.findUnique({
      where: { id },
    });

    if (!prompt) {
      throw new NotFoundException(`StoryPrompt with ID "${id}" not found`);
    }

    return this.prisma.storyPrompt.delete({ where: { id } });
  }

  /**
   * Check if a prompt is currently accepting submissions.
   * Used by StoriesService to validate prompt before creating a story.
   */
  async isPromptOpen(promptId: string): Promise<boolean> {
    const prompt = await this.prisma.storyPrompt.findUnique({
      where: { id: promptId },
    });

    if (!prompt) {
      throw new NotFoundException(
        `StoryPrompt with ID "${promptId}" not found`,
      );
    }

    if (!prompt.isOpen) {
      return false;
    }

    if (prompt.closesAt && prompt.closesAt <= new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Validates that closesAt is not in the past.
   */
  private validateClosesAt(closesAt?: string | null): void {
    if (closesAt && new Date(closesAt) <= new Date()) {
      throw new BadRequestException('closesAt must be in the future');
    }
  }
}
