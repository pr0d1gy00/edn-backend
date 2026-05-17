import { Test, TestingModule } from '@nestjs/testing';
import { StoriesService } from './stories.service';
import { PrismaService } from '../prisma/prisma.service';
import { StoryPromptsService } from '../story-prompts/story-prompts.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('StoriesService', () => {
  let service: StoriesService;
  let prisma: PrismaService;

  const mockStory = {
    id: 'story-123',
    userId: 'user-456',
    promptId: 'prompt-123',
    title: 'Test Story',
    content: 'This is a test story content',
    submittedAt: new Date('2025-01-01'),
    isApproved: true,
    _count: { votes: 3 },
    user: {
      id: 'user-456',
      username: 'testuser',
      email: 'test@example.com',
      avatarUrl: null,
      createdAt: new Date('2025-01-01'),
    },
  };

  const mockUnapprovedStory = {
    ...mockStory,
    id: 'story-unapproved',
    isApproved: false,
    user: null,
  };

  const mockPrismaService = {
    communityStory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockStoryPromptsService = {
    isPromptOpen: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: StoryPromptsService,
          useValue: mockStoryPromptsService,
        },
      ],
    }).compile();

    service = module.get<StoriesService>(StoriesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      title: 'New Story',
      content: 'Some content',
      userId: 'user-456',
      promptId: 'prompt-123',
    };

    it('should create a story with userId and promptId', async () => {
      mockStoryPromptsService.isPromptOpen.mockResolvedValue(true);
      mockPrismaService.communityStory.create.mockResolvedValue(mockStory);

      const result = await service.create(createDto);

      expect(result).toEqual(mockStory);
      expect(mockStoryPromptsService.isPromptOpen).toHaveBeenCalledWith(
        'prompt-123',
      );
      expect(mockPrismaService.communityStory.create).toHaveBeenCalledWith({
        data: {
          title: 'New Story',
          content: 'Some content',
          userId: 'user-456',
          promptId: 'prompt-123',
        },
        include: {
          _count: { select: { votes: true } },
          user: true,
        },
      });
    });

    it('should create an anonymous story when userId is omitted', async () => {
      const anonDto = {
        title: 'Anon Story',
        content: 'Anonymous content',
        promptId: 'prompt-123',
      };
      mockStoryPromptsService.isPromptOpen.mockResolvedValue(true);
      mockPrismaService.communityStory.create.mockResolvedValue({
        ...mockStory,
        userId: null,
        user: null,
      });

      const result = await service.create(anonDto);

      expect(result.userId).toBeNull();
      expect(mockPrismaService.communityStory.create).toHaveBeenCalledWith({
        data: {
          title: 'Anon Story',
          content: 'Anonymous content',
          userId: null,
          promptId: 'prompt-123',
        },
        include: {
          _count: { select: { votes: true } },
          user: true,
        },
      });
    });

    it('should throw BadRequestException when prompt is closed', async () => {
      mockStoryPromptsService.isPromptOpen.mockResolvedValue(false);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'This story prompt is no longer accepting submissions',
      );
      expect(mockPrismaService.communityStory.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return only approved stories from public prompts', async () => {
      mockPrismaService.communityStory.findMany.mockResolvedValue([mockStory]);

      const result = await service.findAll();

      expect(result).toEqual([mockStory]);
      expect(mockPrismaService.communityStory.findMany).toHaveBeenCalledWith({
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
    });

    it('should return an empty array when no approved stories exist', async () => {
      mockPrismaService.communityStory.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findAllAdmin', () => {
    it('should return all approved stories regardless of prompt visibility', async () => {
      mockPrismaService.communityStory.findMany.mockResolvedValue([mockStory]);

      const result = await service.findAllAdmin();

      expect(result).toEqual([mockStory]);
      expect(mockPrismaService.communityStory.findMany).toHaveBeenCalledWith({
        where: { isApproved: true },
        include: {
          _count: { select: { votes: true } },
          user: true,
        },
        orderBy: { submittedAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return an approved story from a public prompt', async () => {
      mockPrismaService.communityStory.findFirst.mockResolvedValue(mockStory);

      const result = await service.findOne('story-123');

      expect(result).toEqual(mockStory);
      expect(mockPrismaService.communityStory.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'story-123',
          isApproved: true,
          prompt: { isPublic: true },
        },
        include: {
          _count: { select: { votes: true } },
          user: true,
        },
      });
    });

    it('should throw NotFoundException for an unapproved story', async () => {
      mockPrismaService.communityStory.findFirst.mockResolvedValue(null);

      await expect(service.findOne('story-unapproved')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when story is from a private prompt', async () => {
      mockPrismaService.communityStory.findFirst.mockResolvedValue(null);

      await expect(service.findOne('story-private-prompt')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when story does not exist', async () => {
      mockPrismaService.communityStory.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Story with ID "nonexistent" not found',
      );
    });
  });

  describe('findOneAdmin', () => {
    it('should return any story regardless of approval or prompt visibility', async () => {
      mockPrismaService.communityStory.findUnique.mockResolvedValue(
        mockUnapprovedStory,
      );

      const result = await service.findOneAdmin('story-unapproved');

      expect(result).toEqual(mockUnapprovedStory);
      expect(mockPrismaService.communityStory.findUnique).toHaveBeenCalledWith({
        where: { id: 'story-unapproved' },
        include: {
          _count: { select: { votes: true } },
          user: true,
        },
      });
    });

    it('should throw NotFoundException when story does not exist', async () => {
      mockPrismaService.communityStory.findUnique.mockResolvedValue(null);

      await expect(service.findOneAdmin('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = { title: 'Updated Title' };

    it('should update story fields', async () => {
      mockPrismaService.communityStory.findUnique.mockResolvedValue(mockStory);
      mockPrismaService.communityStory.update.mockResolvedValue({
        ...mockStory,
        title: 'Updated Title',
      });

      const result = await service.update('story-123', updateDto);

      expect(result.title).toBe('Updated Title');
      expect(mockPrismaService.communityStory.update).toHaveBeenCalledWith({
        where: { id: 'story-123' },
        data: { title: 'Updated Title' },
        include: {
          _count: { select: { votes: true } },
          user: true,
        },
      });
    });

    it('should preserve isApproved when updating', async () => {
      const storyWithApproved = { ...mockStory, isApproved: true };
      mockPrismaService.communityStory.findUnique.mockResolvedValue(
        storyWithApproved,
      );
      mockPrismaService.communityStory.update.mockResolvedValue({
        ...storyWithApproved,
        title: 'Updated',
      });

      const result = await service.update('story-123', { title: 'Updated' });

      expect(result.isApproved).toBe(true);
      // update call should NOT include isApproved in data
      expect(mockPrismaService.communityStory.update).toHaveBeenCalledWith({
        where: { id: 'story-123' },
        data: { title: 'Updated' },
        include: {
          _count: { select: { votes: true } },
          user: true,
        },
      });
    });

    it('should throw NotFoundException if story does not exist', async () => {
      mockPrismaService.communityStory.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete and return the story', async () => {
      mockPrismaService.communityStory.findUnique.mockResolvedValue(mockStory);
      mockPrismaService.communityStory.delete.mockResolvedValue(mockStory);

      const result = await service.remove('story-123');

      expect(result).toEqual(mockStory);
      expect(mockPrismaService.communityStory.delete).toHaveBeenCalledWith({
        where: { id: 'story-123' },
      });
    });

    it('should throw NotFoundException if story does not exist', async () => {
      mockPrismaService.communityStory.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approve', () => {
    it('should set isApproved=true on an unapproved story', async () => {
      mockPrismaService.communityStory.findUnique.mockResolvedValue(
        mockUnapprovedStory,
      );
      mockPrismaService.communityStory.update.mockResolvedValue({
        ...mockUnapprovedStory,
        isApproved: true,
      });

      const result = await service.approve('story-unapproved');

      expect(result.isApproved).toBe(true);
      expect(mockPrismaService.communityStory.update).toHaveBeenCalledWith({
        where: { id: 'story-unapproved' },
        data: { isApproved: true },
        include: {
          _count: { select: { votes: true } },
          user: true,
        },
      });
    });

    it('should be idempotent on an already approved story', async () => {
      mockPrismaService.communityStory.findUnique.mockResolvedValue(mockStory);

      const result = await service.approve('story-123');

      expect(result).toEqual(mockStory);
      expect(result.isApproved).toBe(true);
      // update should NOT be called since story is already approved
      expect(mockPrismaService.communityStory.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if story does not exist', async () => {
      mockPrismaService.communityStory.findUnique.mockResolvedValue(null);

      await expect(service.approve('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reject', () => {
    it('should delete the story', async () => {
      mockPrismaService.communityStory.findUnique.mockResolvedValue(
        mockUnapprovedStory,
      );
      mockPrismaService.communityStory.delete.mockResolvedValue(
        mockUnapprovedStory,
      );

      const result = await service.reject('story-unapproved');

      expect(result).toEqual(mockUnapprovedStory);
      expect(mockPrismaService.communityStory.delete).toHaveBeenCalledWith({
        where: { id: 'story-unapproved' },
      });
    });

    it('should throw NotFoundException if story does not exist', async () => {
      mockPrismaService.communityStory.findUnique.mockResolvedValue(null);

      await expect(service.reject('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
