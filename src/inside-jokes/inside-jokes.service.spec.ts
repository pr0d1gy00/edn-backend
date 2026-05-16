import { Test, TestingModule } from '@nestjs/testing';
import { InsideJokesService } from './inside-jokes.service';
import { PrismaService } from '../prisma/prisma.service';
import { EpisodesService } from '../episodes/episodes.service';
import { NotFoundException } from '@nestjs/common';

describe('InsideJokesService', () => {
  let service: InsideJokesService;

  const mockInsideJoke = {
    id: 'joke-123',
    episodeId: 'ep-1',
    startTimeStamp: '00:14:23',
    endTimeStamp: '00:15:00',
    keyConcept: 'Chupis',
    transcriptContext: 'Leo mentions chupis...',
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2025-06-01'),
  };

  const mockPrismaService = {
    insideJoke: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockEpisodesService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsideJokesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EpisodesService,
          useValue: mockEpisodesService,
        },
      ],
    }).compile();

    service = module.get<InsideJokesService>(InsideJokesService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      episodeId: 'ep-1',
      startTimeStamp: '00:14:23',
      endTimeStamp: '00:15:00',
      keyConcept: 'Chupis',
      transcriptContext: 'Leo mentions chupis...',
    };

    it('should create an inside joke with all fields', async () => {
      mockEpisodesService.findOne.mockResolvedValue({ id: 'ep-1' });
      mockPrismaService.insideJoke.create.mockResolvedValue(mockInsideJoke);

      const result = await service.create(createDto);

      expect(result).toEqual(mockInsideJoke);
      expect(mockEpisodesService.findOne).toHaveBeenCalledWith('ep-1');
      expect(mockPrismaService.insideJoke.create).toHaveBeenCalledWith({
        data: {
          episodeId: 'ep-1',
          startTimeStamp: '00:14:23',
          endTimeStamp: '00:15:00',
          keyConcept: 'Chupis',
          transcriptContext: 'Leo mentions chupis...',
        },
      });
    });

    it('should throw NotFoundException when episode does not exist', async () => {
      mockEpisodesService.findOne.mockRejectedValue(
        new NotFoundException('Episode with ID "fake-id" not found'),
      );

      await expect(
        service.create({ ...createDto, episodeId: 'fake-id' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockEpisodesService.findOne).toHaveBeenCalledWith('fake-id');
      expect(mockPrismaService.insideJoke.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return the inside joke when found', async () => {
      mockPrismaService.insideJoke.findUnique.mockResolvedValue(mockInsideJoke);

      const result = await service.findOne('joke-123');

      expect(result).toEqual(mockInsideJoke);
      expect(mockPrismaService.insideJoke.findUnique).toHaveBeenCalledWith({
        where: { id: 'joke-123' },
      });
    });

    it('should throw NotFoundException when inside joke does not exist', async () => {
      mockPrismaService.insideJoke.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'InsideJoke with ID "nonexistent" not found',
      );
    });
  });

  describe('findAll', () => {
    it('should filter by episodeId when provided', async () => {
      const jokes = [mockInsideJoke];
      mockPrismaService.insideJoke.findMany.mockResolvedValue(jokes);

      const result = await service.findAll({ episodeId: 'ep-1' });

      expect(result).toEqual(jokes);
      expect(mockPrismaService.insideJoke.findMany).toHaveBeenCalledWith({
        where: { episodeId: 'ep-1' },
        orderBy: { startTimeStamp: 'asc' },
      });
    });

    it('should filter by keyConcept with case-insensitive contains', async () => {
      mockPrismaService.insideJoke.findMany.mockResolvedValue([
        mockInsideJoke,
      ]);

      const result = await service.findAll({ keyConcept: 'chupis' });

      expect(result).toEqual([mockInsideJoke]);
      expect(mockPrismaService.insideJoke.findMany).toHaveBeenCalledWith({
        where: {
          keyConcept: { contains: 'chupis', mode: 'insensitive' },
        },
        orderBy: { startTimeStamp: 'asc' },
      });
    });

    it('should apply both episodeId and keyConcept filters when both provided', async () => {
      mockPrismaService.insideJoke.findMany.mockResolvedValue([
        mockInsideJoke,
      ]);

      const result = await service.findAll({
        episodeId: 'ep-1',
        keyConcept: 'chupis',
      });

      expect(result).toEqual([mockInsideJoke]);
      expect(mockPrismaService.insideJoke.findMany).toHaveBeenCalledWith({
        where: {
          episodeId: 'ep-1',
          keyConcept: { contains: 'chupis', mode: 'insensitive' },
        },
        orderBy: { startTimeStamp: 'asc' },
      });
    });

    it('should return empty array when no results match', async () => {
      mockPrismaService.insideJoke.findMany.mockResolvedValue([]);

      const result = await service.findAll({ episodeId: 'ep-99' });

      expect(result).toEqual([]);
      expect(mockPrismaService.insideJoke.findMany).toHaveBeenCalledWith({
        where: { episodeId: 'ep-99' },
        orderBy: { startTimeStamp: 'asc' },
      });
    });
  });

  describe('update', () => {
    it('should update and return the inside joke with partial fields', async () => {
      mockPrismaService.insideJoke.findUnique.mockResolvedValue(mockInsideJoke);
      mockPrismaService.insideJoke.update.mockResolvedValue({
        ...mockInsideJoke,
        keyConcept: 'New Concept',
      });

      const result = await service.update('joke-123', {
        keyConcept: 'New Concept',
      });

      expect(result.keyConcept).toBe('New Concept');
      expect(mockPrismaService.insideJoke.findUnique).toHaveBeenCalledWith({
        where: { id: 'joke-123' },
      });
      expect(mockPrismaService.insideJoke.update).toHaveBeenCalledWith({
        where: { id: 'joke-123' },
        data: { keyConcept: 'New Concept' },
      });
    });

    it('should throw NotFoundException when inside joke does not exist', async () => {
      mockPrismaService.insideJoke.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { keyConcept: 'Test' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.insideJoke.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete and return the inside joke', async () => {
      mockPrismaService.insideJoke.findUnique.mockResolvedValue(mockInsideJoke);
      mockPrismaService.insideJoke.delete.mockResolvedValue(mockInsideJoke);

      const result = await service.remove('joke-123');

      expect(result).toEqual(mockInsideJoke);
      expect(mockPrismaService.insideJoke.findUnique).toHaveBeenCalledWith({
        where: { id: 'joke-123' },
      });
      expect(mockPrismaService.insideJoke.delete).toHaveBeenCalledWith({
        where: { id: 'joke-123' },
      });
    });

    it('should throw NotFoundException when inside joke does not exist', async () => {
      mockPrismaService.insideJoke.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.insideJoke.delete).not.toHaveBeenCalled();
    });
  });
});
