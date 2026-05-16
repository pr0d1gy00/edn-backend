import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from './media.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';

jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: jest.fn().mockImplementation(() => ({
    done: jest.fn().mockResolvedValue(undefined),
  })),
}));

const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  DeleteObjectCommand: jest.fn().mockImplementation((params) => params),
}));

describe('MediaService', () => {
  let service: MediaService;
  let prisma: PrismaService;

  const mockMedia = {
    id: 'media-123',
    entityType: 'TOUR_SHOW',
    entityId: 'show-abc',
    url: 'https://s3.us-west-1.idrivee2.com/edn/TOUR_SHOW/show-abc/test.jpg',
    key: 'TOUR_SHOW/show-abc/test.jpg',
    isPrimary: false,
    sortOrder: 0,
    createdAt: new Date(),
  };

  const mockPrismaService = {
    media: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockFile = {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-data'),
    size: 1024,
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('should upload file to S3 and save media record', async () => {
      mockPrismaService.media.create.mockResolvedValue(mockMedia);

      const result = await service.upload(mockFile, 'TOUR_SHOW', 'show-abc', false);

      expect(result).toEqual(mockMedia);
      expect(mockPrismaService.media.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'TOUR_SHOW',
          entityId: 'show-abc',
          isPrimary: false,
          url: expect.stringContaining('TOUR_SHOW/show-abc'),
          key: expect.stringContaining('TOUR_SHOW/show-abc'),
        }),
      });
    });

    it('should set isPrimary to true when provided', async () => {
      mockPrismaService.media.create.mockResolvedValue({
        ...mockMedia,
        isPrimary: true,
      });

      await service.upload(mockFile, 'TOUR_SHOW', 'show-abc', true);

      expect(mockPrismaService.media.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isPrimary: true,
        }),
      });
    });

    it('should reject non-image MIME types', async () => {
      const badFile = { ...mockFile, mimetype: 'application/pdf' };

      await expect(
        service.upload(badFile, 'TOUR_SHOW', 'show-abc'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.upload(badFile, 'TOUR_SHOW', 'show-abc'),
      ).rejects.toThrow('Invalid MIME type');
    });

    it('should reject non-image file extensions', async () => {
      const badFile = { ...mockFile, originalname: 'document.pdf' };

      await expect(
        service.upload(badFile, 'TOUR_SHOW', 'show-abc'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.upload(badFile, 'TOUR_SHOW', 'show-abc'),
      ).rejects.toThrow('Invalid file extension');
    });

    it('should reject null file', async () => {
      await expect(
        service.upload(null as any, 'TOUR_SHOW', 'show-abc'),
      ).rejects.toThrow('No file provided');
    });

    it('should reject invalid entityType', async () => {
      await expect(
        service.upload(mockFile, 'INVALID', 'show-abc'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.upload(mockFile, 'INVALID', 'show-abc'),
      ).rejects.toThrow('Invalid entityType');
    });

    it('should upload Episode media', async () => {
      mockPrismaService.media.create.mockResolvedValue({
        ...mockMedia,
        entityType: 'EPISODE',
        entityId: 'ep-456',
      });

      const result = await service.upload(mockFile, 'EPISODE', 'ep-456');

      expect(result.entityType).toBe('EPISODE');
      expect(mockPrismaService.media.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'EPISODE',
          entityId: 'ep-456',
        }),
      });
    });

    it('should accept .webp files', async () => {
      const webpFile = {
        ...mockFile,
        originalname: 'image.webp',
        mimetype: 'image/webp',
      };
      mockPrismaService.media.create.mockResolvedValue(mockMedia);

      const result = await service.upload(webpFile, 'TOUR_SHOW', 'show-abc');

      expect(result).toEqual(mockMedia);
    });
  });

  describe('remove', () => {
    it('should delete from S3 and database', async () => {
      mockPrismaService.media.findUnique.mockResolvedValue(mockMedia);
      mockSend.mockResolvedValue({});

      await service.remove('media-123');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: expect.any(String),
          Key: mockMedia.key,
        }),
      );
      expect(mockPrismaService.media.delete).toHaveBeenCalledWith({
        where: { id: 'media-123' },
      });
    });

    it('should throw NotFoundException when media does not exist', async () => {
      mockPrismaService.media.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('nonexistent')).rejects.toThrow(
        'Media with ID "nonexistent" not found',
      );
    });

    it('should throw InternalServerErrorException on S3 delete failure', async () => {
      mockPrismaService.media.findUnique.mockResolvedValue(mockMedia);
      mockSend.mockRejectedValue(new Error('S3 error'));

      await expect(service.remove('media-123')).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockPrismaService.media.delete).not.toHaveBeenCalled();
    });
  });

  describe('findByEntity', () => {
    it('should return media for an entity', async () => {
      const mediaList = [mockMedia, { ...mockMedia, id: 'media-456' }];
      mockPrismaService.media.findMany.mockResolvedValue(mediaList);

      const result = await service.findByEntity('TOUR_SHOW', 'show-abc');

      expect(result).toEqual(mediaList);
      expect(mockPrismaService.media.findMany).toHaveBeenCalledWith({
        where: {
          entityType: 'TOUR_SHOW',
          entityId: 'show-abc',
        },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('should return empty array when no media exists', async () => {
      mockPrismaService.media.findMany.mockResolvedValue([]);

      const result = await service.findByEntity('TOUR_SHOW', 'show-abc');

      expect(result).toEqual([]);
    });

    it('should reject invalid entityType', async () => {
      await expect(
        service.findByEntity('INVALID', 'show-abc'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
