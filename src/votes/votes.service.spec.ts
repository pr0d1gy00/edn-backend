import { Test, TestingModule } from '@nestjs/testing';
import { VotesService } from './votes.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('VotesService', () => {
  let service: VotesService;
  let prisma: PrismaService;

  const mockStory = {
    id: 'story-789',
    userId: null,
    title: 'Test Story',
    content: 'Story content',
    category: null,
    submittedAt: new Date('2025-01-01'),
    isApproved: true,
  };

  const mockVote = {
    id: 'vote-123',
    userId: 'user-456',
    storyId: 'story-789',
    voteValue: 1,
  };

  const mockPrismaService = {
    communityStory: {
      findUnique: jest.fn(),
    },
    storyVote: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<VotesService>(VotesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('castVote', () => {
    const storyId = 'story-789';
    const userId = 'user-456';

    it('should create a new vote when user has not voted before', async () => {
      mockPrismaService.communityStory.findUnique.mockResolvedValue(mockStory);
      mockPrismaService.storyVote.upsert.mockResolvedValue(mockVote);

      const result = await service.castVote(storyId, userId, 1);

      expect(result).toEqual(mockVote);
      expect(mockPrismaService.storyVote.upsert).toHaveBeenCalledWith({
        where: { userId_storyId: { userId, storyId } },
        create: { userId, storyId, voteValue: 1 },
        update: { voteValue: 1 },
      });
    });

    it('should update an existing vote when user changes their vote', async () => {
      const updatedVote = { ...mockVote, voteValue: -1 };
      mockPrismaService.communityStory.findUnique.mockResolvedValue(mockStory);
      mockPrismaService.storyVote.upsert.mockResolvedValue(updatedVote);

      const result = await service.castVote(storyId, userId, -1);

      expect(result.voteValue).toBe(-1);
      expect(mockPrismaService.storyVote.upsert).toHaveBeenCalledWith({
        where: { userId_storyId: { userId, storyId } },
        create: { userId, storyId, voteValue: -1 },
        update: { voteValue: -1 },
      });
    });

    it('should throw NotFoundException when story does not exist', async () => {
      mockPrismaService.communityStory.findUnique.mockResolvedValue(null);

      await expect(service.castVote(storyId, userId, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.castVote(storyId, userId, 1)).rejects.toThrow(
        'Story with ID "story-789" not found',
      );
    });

    it('should allow downvote with voteValue=-1', async () => {
      const downvote = { ...mockVote, voteValue: -1 };
      mockPrismaService.communityStory.findUnique.mockResolvedValue(mockStory);
      mockPrismaService.storyVote.upsert.mockResolvedValue(downvote);

      const result = await service.castVote(storyId, userId, -1);

      expect(result.voteValue).toBe(-1);
    });
  });

  describe('removeVote', () => {
    const storyId = 'story-789';
    const userId = 'user-456';

    it('should delete and return the vote', async () => {
      mockPrismaService.storyVote.findUnique.mockResolvedValue(mockVote);
      mockPrismaService.storyVote.delete.mockResolvedValue(mockVote);

      const result = await service.removeVote(storyId, userId);

      expect(result).toEqual(mockVote);
      expect(mockPrismaService.storyVote.delete).toHaveBeenCalledWith({
        where: { userId_storyId: { userId, storyId } },
      });
    });

    it('should throw NotFoundException when no vote exists', async () => {
      mockPrismaService.storyVote.findUnique.mockResolvedValue(null);

      await expect(service.removeVote(storyId, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.removeVote(storyId, userId)).rejects.toThrow(
        'Vote by user "user-456" on story "story-789" not found',
      );
    });
  });

  describe('getVoteScore', () => {
    const storyId = 'story-789';

    it('should return the sum of vote values', async () => {
      mockPrismaService.storyVote.aggregate.mockResolvedValue({
        _sum: { voteValue: 5 },
      });

      const result = await service.getVoteScore(storyId);

      expect(result).toEqual({ score: 5 });
      expect(mockPrismaService.storyVote.aggregate).toHaveBeenCalledWith({
        where: { storyId },
        _sum: { voteValue: true },
      });
    });

    it('should return 0 when no votes exist', async () => {
      mockPrismaService.storyVote.aggregate.mockResolvedValue({
        _sum: { voteValue: null },
      });

      const result = await service.getVoteScore(storyId);

      expect(result).toEqual({ score: 0 });
    });

    it('should return negative score for net downvotes', async () => {
      mockPrismaService.storyVote.aggregate.mockResolvedValue({
        _sum: { voteValue: -3 },
      });

      const result = await service.getVoteScore(storyId);

      expect(result).toEqual({ score: -3 });
    });
  });
});
