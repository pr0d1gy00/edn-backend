import { Test, TestingModule } from '@nestjs/testing';
import { StoryPromptsService } from './story-prompts.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('StoryPromptsService', () => {
  let service: StoryPromptsService;

  const now = new Date();
  const future = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 day
  const past = new Date(now.getTime() - 24 * 60 * 60 * 1000); // -1 day

  const mockPrompt = {
    id: 'prompt-123',
    title: 'Funniest Moment',
    description: 'Tell us your funniest EDN moment',
    isOpen: true,
    isPublic: true,
    opensAt: now,
    closesAt: future,
    _count: { stories: 0 },
  };

  const mockClosedPrompt = {
    ...mockPrompt,
    id: 'prompt-closed',
    isOpen: false,
  };

  const mockExpiredPrompt = {
    ...mockPrompt,
    id: 'prompt-expired',
    isOpen: true,
    closesAt: past,
  };

  const mockAlwaysOpenPrompt = {
    ...mockPrompt,
    id: 'prompt-always',
    isOpen: true,
    closesAt: null,
  };

  const mockPrivatePrompt = {
    ...mockPrompt,
    id: 'prompt-private',
    isOpen: true,
    isPublic: false,
    closesAt: future,
  };

  const mockPrismaService = {
    storyPrompt: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoryPromptsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StoryPromptsService>(StoryPromptsService);

    jest.clearAllMocks();
  });

  describe('findOpen', () => {
    it('should return only open public prompts where closesAt is null or in the future', async () => {
      mockPrismaService.storyPrompt.findMany.mockResolvedValue([
        mockPrompt,
        mockAlwaysOpenPrompt,
      ]);

      const result = await service.findOpen();

      expect(result).toEqual([mockPrompt, mockAlwaysOpenPrompt]);
      expect(mockPrismaService.storyPrompt.findMany).toHaveBeenCalledWith({
        where: {
          isOpen: true,
          isPublic: true,
          OR: [{ closesAt: null }, { closesAt: expect.objectContaining({ gt: expect.any(Date) }) }],
        },
        orderBy: { opensAt: 'desc' },
      });
    });

    it('should exclude private prompts when includeAll is false', async () => {
      mockPrismaService.storyPrompt.findMany.mockResolvedValue([
        mockPrompt,
        mockAlwaysOpenPrompt,
      ]);

      const result = await service.findOpen(false);

      expect(result).toEqual([mockPrompt, mockAlwaysOpenPrompt]);
      expect(mockPrismaService.storyPrompt.findMany).toHaveBeenCalledWith({
        where: {
          isOpen: true,
          isPublic: true,
          OR: [{ closesAt: null }, { closesAt: expect.objectContaining({ gt: expect.any(Date) }) }],
        },
        orderBy: { opensAt: 'desc' },
      });
    });

    it('should include private prompts when includeAll is true (ADMIN)', async () => {
      mockPrismaService.storyPrompt.findMany.mockResolvedValue([
        mockPrompt,
        mockAlwaysOpenPrompt,
        mockPrivatePrompt,
      ]);

      const result = await service.findOpen(true);

      expect(result).toHaveLength(3);
      expect(mockPrismaService.storyPrompt.findMany).toHaveBeenCalledWith({
        where: {
          isOpen: true,
          OR: [{ closesAt: null }, { closesAt: expect.objectContaining({ gt: expect.any(Date) }) }],
        },
        orderBy: { opensAt: 'desc' },
      });
    });

    it('should exclude prompts with past closesAt', async () => {
      mockPrismaService.storyPrompt.findMany.mockResolvedValue([]);

      const result = await service.findOpen();

      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all prompts with story count', async () => {
      mockPrismaService.storyPrompt.findMany.mockResolvedValue([
        mockPrompt,
        mockClosedPrompt,
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockPrismaService.storyPrompt.findMany).toHaveBeenCalledWith({
        orderBy: { opensAt: 'desc' },
        include: { _count: { select: { stories: true } } },
      });
    });
  });

  describe('findOne', () => {
    it('should return a prompt with story count', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(mockPrompt);

      const result = await service.findOne('prompt-123');

      expect(result).toEqual(mockPrompt);
      expect(mockPrismaService.storyPrompt.findUnique).toHaveBeenCalledWith({
        where: { id: 'prompt-123' },
        include: { _count: { select: { stories: true } } },
      });
    });

    it('should throw NotFoundException when prompt does not exist', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'StoryPrompt with ID "nonexistent" not found',
      );
    });
  });

  describe('create', () => {
    const createDto = {
      title: 'New Prompt',
      description: 'A new story prompt',
      closesAt: future.toISOString(),
    };

    it('should create a prompt', async () => {
      mockPrismaService.storyPrompt.create.mockResolvedValue(mockPrompt);

      const result = await service.create(createDto);

      expect(result).toEqual(mockPrompt);
      expect(mockPrismaService.storyPrompt.create).toHaveBeenCalledWith({
        data: {
          title: 'New Prompt',
          description: 'A new story prompt',
          opensAt: null,
          closesAt: expect.any(Date),
          isPublic: false,
        },
      });
    });

    it('should throw BadRequestException when closesAt is in the past', async () => {
      const badDto = { title: 'Bad Prompt', closesAt: past.toISOString() };

      await expect(service.create(badDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(badDto)).rejects.toThrow(
        'closesAt must be in the future',
      );
      expect(mockPrismaService.storyPrompt.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update partial fields', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(mockPrompt);
      mockPrismaService.storyPrompt.update.mockResolvedValue({
        ...mockPrompt,
        title: 'Updated',
      });

      const result = await service.update('prompt-123', { title: 'Updated' });

      expect(result.title).toBe('Updated');
      expect(mockPrismaService.storyPrompt.update).toHaveBeenCalledWith({
        where: { id: 'prompt-123' },
        data: { title: 'Updated' },
      });
    });

    it('should throw BadRequestException when new closesAt is in the past', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(mockPrompt);

      await expect(
        service.update('prompt-123', { closesAt: past.toISOString() }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.storyPrompt.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when prompt does not exist', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { title: 'Nope' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('open', () => {
    it('should set isOpen to true', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(
        mockClosedPrompt,
      );
      mockPrismaService.storyPrompt.update.mockResolvedValue({
        ...mockClosedPrompt,
        isOpen: true,
      });

      const result = await service.open('prompt-closed');

      expect(result.isOpen).toBe(true);
      expect(mockPrismaService.storyPrompt.update).toHaveBeenCalledWith({
        where: { id: 'prompt-closed' },
        data: { isOpen: true },
      });
    });

    it('should auto-close if closesAt has passed', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(
        mockExpiredPrompt,
      );
      mockPrismaService.storyPrompt.update.mockResolvedValue({
        ...mockExpiredPrompt,
        isOpen: false,
      });

      const result = await service.open('prompt-expired');

      expect(result.isOpen).toBe(false);
      expect(mockPrismaService.storyPrompt.update).toHaveBeenCalledWith({
        where: { id: 'prompt-expired' },
        data: { isOpen: false },
      });
    });

    it('should throw NotFoundException when prompt does not exist', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(null);

      await expect(service.open('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('close', () => {
    it('should set isOpen to false', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(mockPrompt);
      mockPrismaService.storyPrompt.update.mockResolvedValue({
        ...mockPrompt,
        isOpen: false,
      });

      const result = await service.close('prompt-123');

      expect(result.isOpen).toBe(false);
      expect(mockPrismaService.storyPrompt.update).toHaveBeenCalledWith({
        where: { id: 'prompt-123' },
        data: { isOpen: false },
      });
    });

    it('should throw NotFoundException when prompt does not exist', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(null);

      await expect(service.close('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOpenForVoting', () => {
    it('should return all open prompts regardless of isPublic', async () => {
      mockPrismaService.storyPrompt.findMany.mockResolvedValue([
        mockPrompt,
        mockAlwaysOpenPrompt,
        mockPrivatePrompt,
      ]);

      const result = await service.findOpenForVoting();

      expect(result).toHaveLength(3);
      expect(mockPrismaService.storyPrompt.findMany).toHaveBeenCalledWith({
        where: {
          isOpen: true,
          OR: [{ closesAt: null }, { closesAt: expect.objectContaining({ gt: expect.any(Date) }) }],
        },
        orderBy: { opensAt: 'desc' },
      });
    });
  });

  describe('publish', () => {
    it('should set isPublic to true', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(
        mockPrivatePrompt,
      );
      mockPrismaService.storyPrompt.update.mockResolvedValue({
        ...mockPrivatePrompt,
        isPublic: true,
      });

      const result = await service.publish('prompt-private');

      expect(result.isPublic).toBe(true);
      expect(mockPrismaService.storyPrompt.update).toHaveBeenCalledWith({
        where: { id: 'prompt-private' },
        data: { isPublic: true },
      });
    });

    it('should throw NotFoundException when prompt does not exist', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(null);

      await expect(service.publish('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('unpublish', () => {
    it('should set isPublic to false', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(mockPrompt);
      mockPrismaService.storyPrompt.update.mockResolvedValue({
        ...mockPrompt,
        isPublic: false,
      });

      const result = await service.unpublish('prompt-123');

      expect(result.isPublic).toBe(false);
      expect(mockPrismaService.storyPrompt.update).toHaveBeenCalledWith({
        where: { id: 'prompt-123' },
        data: { isPublic: false },
      });
    });

    it('should throw NotFoundException when prompt does not exist', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(null);

      await expect(service.unpublish('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete the prompt', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(mockPrompt);
      mockPrismaService.storyPrompt.delete.mockResolvedValue(mockPrompt);

      const result = await service.remove('prompt-123');

      expect(result).toEqual(mockPrompt);
      expect(mockPrismaService.storyPrompt.delete).toHaveBeenCalledWith({
        where: { id: 'prompt-123' },
      });
    });

    it('should throw NotFoundException when prompt does not exist', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.storyPrompt.delete).not.toHaveBeenCalled();
    });
  });

  describe('isPromptOpen', () => {
    it('should return true for an open prompt with future closesAt', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(mockPrompt);

      const result = await service.isPromptOpen('prompt-123');

      expect(result).toBe(true);
    });

    it('should return true for an open prompt with no closesAt', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(
        mockAlwaysOpenPrompt,
      );

      const result = await service.isPromptOpen('prompt-always');

      expect(result).toBe(true);
    });

    it('should return false for a closed prompt', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(
        mockClosedPrompt,
      );

      const result = await service.isPromptOpen('prompt-closed');

      expect(result).toBe(false);
    });

    it('should return false for an open prompt with past closesAt', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(
        mockExpiredPrompt,
      );

      const result = await service.isPromptOpen('prompt-expired');

      expect(result).toBe(false);
    });

    it('should throw NotFoundException when prompt does not exist', async () => {
      mockPrismaService.storyPrompt.findUnique.mockResolvedValue(null);

      await expect(service.isPromptOpen('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
