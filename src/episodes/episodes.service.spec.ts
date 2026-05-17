import { Test, TestingModule } from '@nestjs/testing';
import { EpisodesService } from './episodes.service';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('EpisodesService', () => {
  let service: EpisodesService;
  let prisma: PrismaService;

  const mockEpisode = {
    id: 'episode-123',
    episodeNumber: 42,
    title: 'Test Episode',
    description: 'A test episode description',
    platformType: 'YOUTUBE',
    contentUrl: 'https://youtube.com/watch?v=abc',
    thumbnailUrl: 'https://img.example.com/thumb.jpg',
    publishedAt: new Date('2025-06-01'),
    isExclusive: false,
    durationSeconds: 3600,
  };

  const mockGuest = {
    id: 'guest-456',
    name: 'Test Guest',
    bio: 'A funny comedian',
    twitterHandle: '@testguest',
    instagramHandle: '@testguest',
  };

  const mockEpisodeWithGuests = {
    ...mockEpisode,
    guests: [mockGuest],
  };

  const mockInsideJoke = {
    id: 'joke-789',
    episodeId: 'episode-123',
    startTimeStamp: '00:14:23',
    endTimeStamp: '00:16:45',
    keyConcept: 'Chupis',
    transcriptContext: 'Cuando Juani menciona las Chupis',
  };

  const mockEpisodeFull = {
    ...mockEpisode,
    guests: [mockGuest],
    insideJokes: [mockInsideJoke],
  };

  const mockPrismaService = {
    episode: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    guest: {
      findUnique: jest.fn(),
    },
  };

  const mockMediaService = {
    upload: jest.fn(),
    remove: jest.fn(),
    findByEntity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EpisodesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MediaService,
          useValue: mockMediaService,
        },
      ],
    }).compile();

    service = module.get<EpisodesService>(EpisodesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      title: 'New Episode',
      platformType: 'YOUTUBE' as const,
      contentUrl: 'https://youtube.com/watch?v=xyz',
      publishedAt: '2025-07-01',
      episodeNumber: 43,
      description: 'A new episode',
      thumbnailUrl: 'https://img.example.com/new.jpg',
      isExclusive: true,
      durationSeconds: 1800,
    };

    it('should create an episode with all fields', async () => {
      mockPrismaService.episode.create.mockResolvedValue({
        ...mockEpisode,
        title: 'New Episode',
        episodeNumber: 43,
        publishedAt: new Date('2025-07-01'),
      });

      const result = await service.create(createDto);

      expect(result.title).toBe('New Episode');
      expect(mockPrismaService.episode.create).toHaveBeenCalledWith({
        data: {
          title: 'New Episode',
          platformType: 'YOUTUBE',
          contentUrl: 'https://youtube.com/watch?v=xyz',
          publishedAt: new Date('2025-07-01'),
          episodeNumber: 43,
          description: 'A new episode',
          thumbnailUrl: 'https://img.example.com/new.jpg',
          isExclusive: true,
          durationSeconds: 1800,
        },
      });
    });

    it('should create an episode with only required fields', async () => {
      const minimalDto = {
        title: 'Minimal Episode',
        platformType: 'SPOTIFY' as const,
        contentUrl: 'https://spotify.com/ep/123',
        publishedAt: '2025-08-01',
      };

      mockPrismaService.episode.create.mockResolvedValue({
        ...mockEpisode,
        title: 'Minimal Episode',
        episodeNumber: null,
      });

      await service.create(minimalDto);

      expect(mockPrismaService.episode.create).toHaveBeenCalledWith({
        data: {
          title: 'Minimal Episode',
          platformType: 'SPOTIFY',
          contentUrl: 'https://spotify.com/ep/123',
          publishedAt: new Date('2025-08-01'),
          episodeNumber: null,
          description: null,
          thumbnailUrl: null,
          isExclusive: false,
          durationSeconds: null,
        },
      });
    });

    it('should throw ConflictException on duplicate episodeNumber', async () => {
      const p2002Error = {
        code: 'P2002',
        meta: { target: ['episode_number'] },
      };
      mockPrismaService.episode.create.mockRejectedValue(p2002Error);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'An episode with this episode number already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated episodes ordered by publishedAt desc', async () => {
      const episodes = [mockEpisodeFull, { ...mockEpisodeFull, id: 'ep-2' }];
      mockPrismaService.episode.findMany.mockResolvedValue(episodes);
      mockPrismaService.episode.count.mockResolvedValue(2);

      const result = await service.findAll(undefined, 1, 10);

      expect(result.data).toEqual(episodes);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
      expect(mockPrismaService.episode.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 10,
        include: { guests: true, insideJokes: true },
      });
    });

    it('should filter by platformType when provided', async () => {
      mockPrismaService.episode.findMany.mockResolvedValue([mockEpisodeFull]);
      mockPrismaService.episode.count.mockResolvedValue(1);

      const result = await service.findAll('YOUTUBE', 1, 10);

      expect(result.data).toEqual([mockEpisodeFull]);
      expect(mockPrismaService.episode.findMany).toHaveBeenCalledWith({
        where: { platformType: 'YOUTUBE' },
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 10,
        include: { guests: true, insideJokes: true },
      });
    });

    it('should return paginated empty array when no episodes exist', async () => {
      mockPrismaService.episode.findMany.mockResolvedValue([]);
      mockPrismaService.episode.count.mockResolvedValue(0);

      const result = await service.findAll(undefined, 1, 10);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should correctly calculate skip for page 2', async () => {
      mockPrismaService.episode.findMany.mockResolvedValue([mockEpisodeFull]);
      mockPrismaService.episode.count.mockResolvedValue(15);

      const result = await service.findAll(undefined, 2, 5);

      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(5);
      expect(result.meta.totalPages).toBe(3);
      expect(mockPrismaService.episode.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { publishedAt: 'desc' },
        skip: 5,
        take: 5,
        include: { guests: true, insideJokes: true },
      });
    });
  });

  describe('findOne', () => {
    it('should return episode with guests included', async () => {
      mockPrismaService.episode.findUnique.mockResolvedValue(
        mockEpisodeWithGuests,
      );

      const result = await service.findOne('episode-123');

      expect(result).toEqual(mockEpisodeWithGuests);
      expect(result.guests).toHaveLength(1);
      expect(mockPrismaService.episode.findUnique).toHaveBeenCalledWith({
        where: { id: 'episode-123' },
        include: { guests: true },
      });
    });

    it('should throw NotFoundException when episode does not exist', async () => {
      mockPrismaService.episode.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Episode with ID "nonexistent" not found',
      );
    });
  });

  describe('update', () => {
    const updateDto = { title: 'Updated Title' };

    it('should update episode fields', async () => {
      mockPrismaService.episode.findUnique.mockResolvedValue(mockEpisode);
      mockPrismaService.episode.update.mockResolvedValue({
        ...mockEpisode,
        title: 'Updated Title',
      });

      const result = await service.update('episode-123', updateDto);

      expect(result.title).toBe('Updated Title');
      expect(mockPrismaService.episode.update).toHaveBeenCalledWith({
        where: { id: 'episode-123' },
        data: { title: 'Updated Title' },
      });
    });

    it('should throw NotFoundException if episode does not exist', async () => {
      mockPrismaService.episode.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate episodeNumber during update', async () => {
      mockPrismaService.episode.findUnique.mockResolvedValue(mockEpisode);
      const p2002Error = {
        code: 'P2002',
        meta: { target: ['episode_number'] },
      };
      mockPrismaService.episode.update.mockRejectedValue(p2002Error);

      await expect(
        service.update('episode-123', { episodeNumber: 42 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete and return the episode', async () => {
      mockPrismaService.episode.findUnique.mockResolvedValue(mockEpisode);
      mockPrismaService.episode.delete.mockResolvedValue(mockEpisode);

      const result = await service.remove('episode-123');

      expect(result).toEqual(mockEpisode);
      expect(mockPrismaService.episode.delete).toHaveBeenCalledWith({
        where: { id: 'episode-123' },
      });
    });

    it('should throw NotFoundException if episode does not exist', async () => {
      mockPrismaService.episode.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addGuest', () => {
    it('should connect guest to episode and return episode with guests', async () => {
      mockPrismaService.episode.findUnique.mockResolvedValue(mockEpisode);
      mockPrismaService.guest.findUnique.mockResolvedValue(mockGuest);
      mockPrismaService.episode.update.mockResolvedValue(
        mockEpisodeWithGuests,
      );

      const result = await service.addGuest('episode-123', 'guest-456');

      expect(result).toEqual(mockEpisodeWithGuests);
      expect(mockPrismaService.episode.update).toHaveBeenCalledWith({
        where: { id: 'episode-123' },
        data: { guests: { connect: { id: 'guest-456' } } },
        include: { guests: true },
      });
    });

    it('should throw NotFoundException when episode does not exist', async () => {
      mockPrismaService.episode.findUnique.mockResolvedValue(null);

      await expect(
        service.addGuest('nonexistent', 'guest-456'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.addGuest('nonexistent', 'guest-456'),
      ).rejects.toThrow('Episode with ID "nonexistent" not found');
    });

    it('should throw NotFoundException when guest does not exist', async () => {
      mockPrismaService.episode.findUnique.mockResolvedValue(mockEpisode);
      mockPrismaService.guest.findUnique.mockResolvedValue(null);

      await expect(
        service.addGuest('episode-123', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.addGuest('episode-123', 'nonexistent'),
      ).rejects.toThrow('Guest with ID "nonexistent" not found');
    });

    it('should be idempotent when guest is already connected', async () => {
      mockPrismaService.episode.findUnique.mockResolvedValue(mockEpisode);
      mockPrismaService.guest.findUnique.mockResolvedValue(mockGuest);
      mockPrismaService.episode.update.mockResolvedValue(
        mockEpisodeWithGuests,
      );

      const result = await service.addGuest('episode-123', 'guest-456');

      expect(result).toEqual(mockEpisodeWithGuests);
      // Prisma connect is idempotent — no error expected
    });
  });

  describe('removeGuest', () => {
    it('should disconnect guest from episode and return episode with guests', async () => {
      mockPrismaService.episode.findUnique.mockResolvedValue(mockEpisode);
      mockPrismaService.episode.update.mockResolvedValue({
        ...mockEpisode,
        guests: [],
      });

      const result = await service.removeGuest('episode-123', 'guest-456');

      expect(result.guests).toEqual([]);
      expect(mockPrismaService.episode.update).toHaveBeenCalledWith({
        where: { id: 'episode-123' },
        data: { guests: { disconnect: { id: 'guest-456' } } },
        include: { guests: true },
      });
    });

    it('should throw NotFoundException when episode does not exist', async () => {
      mockPrismaService.episode.findUnique.mockResolvedValue(null);

      await expect(
        service.removeGuest('nonexistent', 'guest-456'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.removeGuest('nonexistent', 'guest-456'),
      ).rejects.toThrow('Episode with ID "nonexistent" not found');
    });
  });

  describe('getGuests', () => {
    it('should return guests for an episode', async () => {
      mockPrismaService.episode.findUnique.mockResolvedValue(
        mockEpisodeWithGuests,
      );

      const result = await service.getGuests('episode-123');

      expect(result).toEqual([mockGuest]);
      expect(mockPrismaService.episode.findUnique).toHaveBeenCalledWith({
        where: { id: 'episode-123' },
        include: { guests: true },
      });
    });

    it('should return empty array when episode has no guests', async () => {
      mockPrismaService.episode.findUnique.mockResolvedValue({
        ...mockEpisode,
        guests: [],
      });

      const result = await service.getGuests('episode-123');

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when episode does not exist', async () => {
      mockPrismaService.episode.findUnique.mockResolvedValue(null);

      await expect(service.getGuests('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getGuests('nonexistent')).rejects.toThrow(
        'Episode with ID "nonexistent" not found',
      );
    });
  });
});
