import { Test, TestingModule } from '@nestjs/testing';
import { TourShowsService } from './tour-shows.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('TourShowsService', () => {
  let service: TourShowsService;
  let prisma: PrismaService;

  const mockTourShow = {
    id: 'show-123',
    city: 'Buenos Aires',
    country: 'Argentina',
    venueName: 'Estadio Monumental',
    showDate: new Date('2026-06-15'),
    ticketUrl: 'https://tickets.example.com/show',
    ticketStatus: 'AVAILABLE',
    latitude: -34.603726,
    longitude: -58.381592,
  };

  const mockPrismaService = {
    tourShow: {
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
        TourShowsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TourShowsService>(TourShowsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      city: 'Córdoba',
      country: 'Argentina',
      venueName: 'Estadio Kempes',
      showDate: '2026-07-20',
      ticketStatus: 'AVAILABLE' as const,
      ticketUrl: 'https://tickets.example.com/cordoba',
      latitude: -31.369,
      longitude: -64.246,
    };

    it('should create a tour show with all fields', async () => {
      mockPrismaService.tourShow.create.mockResolvedValue({
        ...mockTourShow,
        city: 'Córdoba',
        venueName: 'Estadio Kempes',
        showDate: new Date('2026-07-20'),
        ticketUrl: 'https://tickets.example.com/cordoba',
        latitude: -31.369,
        longitude: -64.246,
      });

      const result = await service.create(createDto);

      expect(result.city).toBe('Córdoba');
      expect(result.venueName).toBe('Estadio Kempes');
      expect(mockPrismaService.tourShow.create).toHaveBeenCalledWith({
        data: {
          city: 'Córdoba',
          country: 'Argentina',
          venueName: 'Estadio Kempes',
          showDate: new Date('2026-07-20'),
          ticketStatus: 'AVAILABLE',
          ticketUrl: 'https://tickets.example.com/cordoba',
          latitude: -31.369,
          longitude: -64.246,
        },
      });
    });

    it('should create a tour show with only required fields', async () => {
      const minimalDto = {
        city: 'Rosario',
        country: 'Argentina',
        venueName: 'Teatro El Círculo',
        showDate: '2026-08-10',
      };

      mockPrismaService.tourShow.create.mockResolvedValue({
        ...mockTourShow,
        city: 'Rosario',
        venueName: 'Teatro El Círculo',
        showDate: new Date('2026-08-10'),
        ticketStatus: 'AVAILABLE',
        ticketUrl: null,
        latitude: null,
        longitude: null,
      });

      await service.create(minimalDto);

      expect(mockPrismaService.tourShow.create).toHaveBeenCalledWith({
        data: {
          city: 'Rosario',
          country: 'Argentina',
          venueName: 'Teatro El Círculo',
          showDate: new Date('2026-08-10'),
          ticketStatus: undefined,
          ticketUrl: null,
          latitude: null,
          longitude: null,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all tour shows ordered by showDate asc', async () => {
      const shows = [mockTourShow, { ...mockTourShow, id: 'show-456' }];
      mockPrismaService.tourShow.findMany.mockResolvedValue(shows);

      const result = await service.findAll({});

      expect(result).toEqual(shows);
      expect(mockPrismaService.tourShow.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { showDate: 'asc' },
      });
    });

    it('should filter by ticketStatus when provided', async () => {
      mockPrismaService.tourShow.findMany.mockResolvedValue([mockTourShow]);

      const result = await service.findAll({ ticketStatus: 'AVAILABLE' });

      expect(result).toEqual([mockTourShow]);
      expect(mockPrismaService.tourShow.findMany).toHaveBeenCalledWith({
        where: { ticketStatus: 'AVAILABLE' },
        orderBy: { showDate: 'asc' },
      });
    });

    it('should filter by upcoming when upcoming=true', async () => {
      mockPrismaService.tourShow.findMany.mockResolvedValue([mockTourShow]);

      const result = await service.findAll({ upcoming: true });

      expect(result).toEqual([mockTourShow]);
      expect(mockPrismaService.tourShow.findMany).toHaveBeenCalledWith({
        where: { showDate: { gte: expect.any(Date) } },
        orderBy: { showDate: 'asc' },
      });
    });

    it('should filter by ticketStatus AND upcoming combined', async () => {
      mockPrismaService.tourShow.findMany.mockResolvedValue([mockTourShow]);

      const result = await service.findAll({
        ticketStatus: 'AVAILABLE',
        upcoming: true,
      });

      expect(result).toEqual([mockTourShow]);
      expect(mockPrismaService.tourShow.findMany).toHaveBeenCalledWith({
        where: {
          ticketStatus: 'AVAILABLE',
          showDate: { gte: expect.any(Date) },
        },
        orderBy: { showDate: 'asc' },
      });
    });

    it('should return empty array when no tour shows exist', async () => {
      mockPrismaService.tourShow.findMany.mockResolvedValue([]);

      const result = await service.findAll({});

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a tour show by ID', async () => {
      mockPrismaService.tourShow.findUnique.mockResolvedValue(mockTourShow);

      const result = await service.findOne('show-123');

      expect(result).toEqual(mockTourShow);
      expect(mockPrismaService.tourShow.findUnique).toHaveBeenCalledWith({
        where: { id: 'show-123' },
      });
    });

    it('should throw NotFoundException when tour show does not exist', async () => {
      mockPrismaService.tourShow.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'TourShow with ID "nonexistent" not found',
      );
    });
  });

  describe('update', () => {
    const updateDto = { city: 'Córdoba' };

    it('should update tour show fields partially', async () => {
      mockPrismaService.tourShow.findUnique.mockResolvedValue(mockTourShow);
      mockPrismaService.tourShow.update.mockResolvedValue({
        ...mockTourShow,
        city: 'Córdoba',
      });

      const result = await service.update('show-123', updateDto);

      expect(result.city).toBe('Córdoba');
      expect(mockPrismaService.tourShow.update).toHaveBeenCalledWith({
        where: { id: 'show-123' },
        data: { city: 'Córdoba' },
      });
    });

    it('should throw NotFoundException if tour show does not exist', async () => {
      mockPrismaService.tourShow.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete and return the tour show', async () => {
      mockPrismaService.tourShow.findUnique.mockResolvedValue(mockTourShow);
      mockPrismaService.tourShow.delete.mockResolvedValue(mockTourShow);

      const result = await service.remove('show-123');

      expect(result).toEqual(mockTourShow);
      expect(mockPrismaService.tourShow.delete).toHaveBeenCalledWith({
        where: { id: 'show-123' },
      });
    });

    it('should throw NotFoundException if tour show does not exist', async () => {
      mockPrismaService.tourShow.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
