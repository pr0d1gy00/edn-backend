import { Test, TestingModule } from '@nestjs/testing';
import { GuestsService } from './guests.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('GuestsService', () => {
  let service: GuestsService;
  let prisma: PrismaService;

  const mockGuest = {
    id: 'guest-123',
    name: 'Test Guest',
    bio: 'A funny comedian',
    twitterHandle: '@testguest',
    instagramHandle: '@testguest',
  };

  const mockEpisode = {
    id: 'episode-789',
    episodeNumber: 10,
    title: 'Awesome Episode',
    description: 'A great show',
    platformType: 'YOUTUBE',
    contentUrl: 'https://youtube.com/watch?v=abc',
    thumbnailUrl: 'https://img.example.com/thumb.jpg',
    publishedAt: new Date('2025-06-01'),
    isExclusive: false,
    durationSeconds: 3600,
  };

  const mockGuestWithEpisodes = {
    ...mockGuest,
    episodes: [mockEpisode],
  };

  const mockPrismaService = {
    guest: {
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
        GuestsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GuestsService>(GuestsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDtoWithSocials = {
      name: 'New Guest',
      bio: 'A talented musician',
      twitterHandle: '@newguest',
      instagramHandle: '@newguest',
    };

    it('should create a guest with all fields including social handles', async () => {
      mockPrismaService.guest.create.mockResolvedValue({
        id: 'guest-999',
        ...createDtoWithSocials,
      });

      const result = await service.create(createDtoWithSocials);

      expect(result.name).toBe('New Guest');
      expect(result.twitterHandle).toBe('@newguest');
      expect(result.instagramHandle).toBe('@newguest');
      expect(mockPrismaService.guest.create).toHaveBeenCalledWith({
        data: {
          name: 'New Guest',
          bio: 'A talented musician',
          twitterHandle: '@newguest',
          instagramHandle: '@newguest',
        },
      });
    });

    it('should create a guest with only required name', async () => {
      const minimalDto = { name: 'Minimal Guest' };

      mockPrismaService.guest.create.mockResolvedValue({
        id: 'guest-min',
        name: 'Minimal Guest',
        bio: null,
        twitterHandle: null,
        instagramHandle: null,
      });

      const result = await service.create(minimalDto);

      expect(result.name).toBe('Minimal Guest');
      expect(result.bio).toBeNull();
      expect(mockPrismaService.guest.create).toHaveBeenCalledWith({
        data: {
          name: 'Minimal Guest',
          bio: null,
          twitterHandle: null,
          instagramHandle: null,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all guests ordered by name ascending', async () => {
      const guests = [
        { ...mockGuest, id: 'guest-a', name: 'Alice' },
        { ...mockGuest, id: 'guest-b', name: 'Bob' },
      ];
      mockPrismaService.guest.findMany.mockResolvedValue(guests);

      const result = await service.findAll();

      expect(result).toEqual(guests);
      expect(mockPrismaService.guest.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });

    it('should return empty array when no guests exist', async () => {
      mockPrismaService.guest.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return guest with episodes included', async () => {
      mockPrismaService.guest.findUnique.mockResolvedValue(
        mockGuestWithEpisodes,
      );

      const result = await service.findOne('guest-123');

      expect(result).toEqual(mockGuestWithEpisodes);
      expect(result.episodes).toHaveLength(1);
      expect(result.episodes[0].title).toBe('Awesome Episode');
      expect(mockPrismaService.guest.findUnique).toHaveBeenCalledWith({
        where: { id: 'guest-123' },
        include: { episodes: true },
      });
    });

    it('should throw NotFoundException when guest does not exist', async () => {
      mockPrismaService.guest.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Guest with ID "nonexistent" not found',
      );
    });
  });

  describe('update', () => {
    it('should update provided fields and preserve others', async () => {
      const updateDto = { name: 'Updated Name', twitterHandle: '@updated' };

      mockPrismaService.guest.findUnique.mockResolvedValue(mockGuest);
      mockPrismaService.guest.update.mockResolvedValue({
        ...mockGuest,
        ...updateDto,
      });

      const result = await service.update('guest-123', updateDto);

      expect(result.name).toBe('Updated Name');
      expect(result.twitterHandle).toBe('@updated');
      expect(result.instagramHandle).toBe('@testguest');
      expect(mockPrismaService.guest.update).toHaveBeenCalledWith({
        where: { id: 'guest-123' },
        data: { name: 'Updated Name', twitterHandle: '@updated' },
      });
    });

    it('should throw NotFoundException if guest does not exist', async () => {
      mockPrismaService.guest.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete and return the guest', async () => {
      mockPrismaService.guest.findUnique.mockResolvedValue(mockGuest);
      mockPrismaService.guest.delete.mockResolvedValue(mockGuest);

      const result = await service.remove('guest-123');

      expect(result).toEqual(mockGuest);
      expect(mockPrismaService.guest.delete).toHaveBeenCalledWith({
        where: { id: 'guest-123' },
      });
    });

    it('should throw NotFoundException if guest does not exist', async () => {
      mockPrismaService.guest.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
