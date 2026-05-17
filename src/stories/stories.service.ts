import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StoryPromptsService } from '../story-prompts/story-prompts.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { CommunityStory } from '@prisma/client';

@Injectable()
export class StoriesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => StoryPromptsService))
    private readonly storyPrompts: StoryPromptsService,
  ) {}

  /**
   * PUBLIC — only returns approved stories whose prompt is public.
   */
  async findAll(): Promise<CommunityStory[]> {
    return this.prisma.communityStory.findMany({
      where: {
        isApproved: true,
        prompt: { isPublic: true },
      },
      include: {
        _count: { select: { votes: true } },
        user: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /**
   * ADMIN — returns all approved stories regardless of prompt visibility.
   */
  async findAllAdmin(): Promise<CommunityStory[]> {
    return this.prisma.communityStory.findMany({
      where: { isApproved: true },
      include: {
        _count: { select: { votes: true } },
        user: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /**
   * PUBLIC — only returns a story if it's approved AND its prompt is public.
   * Stories linked to private prompts will return 404.
   */
  async findOne(id: string): Promise<CommunityStory> {
    const story = await this.prisma.communityStory.findFirst({
      where: {
        id,
        isApproved: true,
        prompt: { isPublic: true },
      },
      include: {
        _count: { select: { votes: true } },
        user: true,
      },
    });

    if (!story) {
      throw new NotFoundException(`Story with ID "${id}" not found`);
    }

    return story;
  }

  /**
   * ADMIN — returns a story by ID regardless of approval or prompt visibility.
   */
  async findOneAdmin(id: string): Promise<CommunityStory> {
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

    return story;
  }

  async create(dto: CreateStoryDto): Promise<CommunityStory> {
    // Validate prompt is open for submissions
    const promptOpen = await this.storyPrompts.isPromptOpen(dto.promptId);
    if (!promptOpen) {
      throw new BadRequestException(
        'This story prompt is no longer accepting submissions',
      );
    }

    return this.prisma.communityStory.create({
      data: {
        title: dto.title,
        content: dto.content,
        userId: dto.userId ?? null,
        promptId: dto.promptId,
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
