import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'abc-123',
    username: 'testuser',
    email: 'test@example.com',
    avatarUrl: null,
    createdAt: new Date('2025-01-01'),
  };

  const mockPrismaService = {
    user: {
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
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toEqual([mockUser]);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no users exist', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('abc-123');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'abc-123' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'User with ID "nonexistent" not found',
      );
    });
  });

  describe('create', () => {
    const createDto = {
      username: 'newuser',
      email: 'new@example.com',
    };

    it('should create and return a user', async () => {
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        username: 'newuser',
        email: 'new@example.com',
      });

      const result = await service.create(createDto);

      expect(result.username).toBe('newuser');
      expect(result.email).toBe('new@example.com');
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: 'newuser',
          email: 'new@example.com',
          avatarUrl: undefined,
        },
      });
    });

    it('should throw ConflictException on P2002 for duplicate username', async () => {
      const prismaError = {
        code: 'P2002',
        meta: { target: ['username'] },
      };
      mockPrismaService.user.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Username is already taken',
      );
    });

    it('should throw ConflictException on P2002 for duplicate email', async () => {
      const prismaError = {
        code: 'P2002',
        meta: { target: ['email'] },
      };
      mockPrismaService.user.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Email is already taken',
      );
    });

    it('should rethrow non-P2002 errors', async () => {
      const genericError = new Error('Database connection failed');
      mockPrismaService.user.create.mockRejectedValue(genericError);

      await expect(service.create(createDto)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('update', () => {
    const updateDto = { username: 'updateduser' };

    it('should update and return the user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        username: 'updateduser',
      });

      const result = await service.update('abc-123', updateDto);

      expect(result.username).toBe('updateduser');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'abc-123' },
        data: { username: 'updateduser' },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException on P2002 duplicate during update', async () => {
      const prismaError = {
        code: 'P2002',
        meta: { target: ['username'] },
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockRejectedValue(prismaError);

      await expect(service.update('abc-123', updateDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update('abc-123', updateDto)).rejects.toThrow(
        'Username is already taken',
      );
    });
  });

  describe('remove', () => {
    it('should delete and return the user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove('abc-123');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'abc-123' },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
