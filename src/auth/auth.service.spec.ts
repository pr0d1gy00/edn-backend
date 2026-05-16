import { AuthService, AuthTokensResponse } from './auth.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { Role } from '@prisma/client';

// ── Mock bcryptjs ──────────────────────────────────────────────────
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcryptjs';

// ── Helpers ────────────────────────────────────────────────────────
const mockUser = {
  id: 'user-uuid-1',
  username: 'testuser',
  email: 'test@example.com',
  password: '$2a$10$fakehashedpasswordvalue',
  refreshToken: null as string | null,
  role: 'USER' as Role,
  avatarUrl: null,
  createdAt: new Date('2025-01-01'),
};

const mockAdminUser = {
  ...mockUser,
  id: 'user-uuid-2',
  username: 'adminuser',
  email: 'admin@example.com',
  role: 'ADMIN' as Role,
};

function makePrismaMock(overrides: Record<string, jest.Mock> = {}) {
  return {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      ...overrides,
    },
  };
}

function makeJwtServiceMock(overrides: Record<string, jest.Mock> = {}) {
  return {
    sign: jest.fn(),
    verify: jest.fn(),
    ...overrides,
  };
}

// ── Suite ──────────────────────────────────────────────────────────
describe('AuthService', () => {
  let authService: AuthService;
  let prismaMock: ReturnType<typeof makePrismaMock>;
  let jwtMock: ReturnType<typeof makeJwtServiceMock>;

  beforeEach(() => {
    jest.clearAllMocks();

    prismaMock = makePrismaMock();
    jwtMock = makeJwtServiceMock();

    process.env.JWT_ACCESS_SECRET = 'access-test-secret';
    process.env.JWT_REFRESH_SECRET = 'refresh-test-secret';
    process.env.JWT_ACCESS_EXPIRES = '15m';
    process.env.JWT_REFRESH_EXPIRES = '7d';

    authService = new AuthService(prismaMock as any, jwtMock as any);
  });

  // ═══════════════════════════════════════════════════════════════
  //  LOGIN
  // ═══════════════════════════════════════════════════════════════
  describe('login', () => {
    const loginDto = { usernameOrEmail: 'testuser', password: 'correct123' };

    it('should return tokens when logging in with username', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtMock.sign.mockReturnValueOnce('mock-access-token');
      jwtMock.sign.mockReturnValueOnce('mock-refresh-token');
      prismaMock.user.update.mockResolvedValue({ ...mockUser, refreshToken: 'mock-refresh-token' });

      const result = await authService.login(loginDto);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('correct123', mockUser.password);
      expect(result).toEqual<AuthTokensResponse>({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 900,
      });
    });

    it('should return tokens when logging in with email', async () => {
      const emailDto = { usernameOrEmail: 'test@example.com', password: 'correct123' };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtMock.sign.mockReturnValueOnce('mock-access-token');
      jwtMock.sign.mockReturnValueOnce('mock-refresh-token');
      prismaMock.user.update.mockResolvedValue({ ...mockUser, refreshToken: 'mock-refresh-token' });

      const result = await authService.login(emailDto);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(authService.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(authService.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when user has no password set', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, password: null });

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should use same error message for non-existent user and wrong password (prevents user enumeration)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const notFoundError = authService.login(loginDto).catch((e: Error) => e.message);

      jest.clearAllMocks();
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const wrongPassError = authService.login(loginDto).catch((e: Error) => e.message);

      const [err1, err2] = await Promise.all([notFoundError, wrongPassError]);
      expect(err1).toBe(err2);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  //  REGISTER
  // ═══════════════════════════════════════════════════════════════
  describe('register', () => {
    const registerDto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'strongpassword123',
    };

    it('should register a new user with hashed password', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$newhashedpassword');
      prismaMock.user.create.mockResolvedValue({
        ...mockUser,
        username: 'newuser',
        email: 'new@example.com',
        password: '$2a$10$newhashedpassword',
      });

      const result = await authService.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('strongpassword123', 10);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          username: 'newuser',
          email: 'new@example.com',
          password: '$2a$10$newhashedpassword',
        },
      });
      // Password must be excluded from the response
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('username', 'newuser');
      expect(result).toHaveProperty('email', 'new@example.com');
    });

    it('should throw ConflictException when username already exists', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...mockUser,
        username: 'newuser',
        email: 'other@example.com',
      });

      await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(authService.register(registerDto)).rejects.toThrow('Username is already taken');
    });

    it('should throw ConflictException when email already exists', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...mockUser,
        username: 'otheruser',
        email: 'new@example.com',
      });

      await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(authService.register(registerDto)).rejects.toThrow('Email is already taken');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  //  REFRESH
  // ═══════════════════════════════════════════════════════════════
  describe('refresh', () => {
    const refreshDto = { refreshToken: 'valid-refresh-token' };

    it('should return new access token when refresh token is valid', async () => {
      jwtMock.verify.mockReturnValue({ sub: 'user-uuid-1' });
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshToken: 'valid-refresh-token',
      });
      jwtMock.sign.mockReturnValue('new-access-token');

      const result = await authService.refresh(refreshDto);

      expect(jwtMock.verify).toHaveBeenCalledWith('valid-refresh-token', {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-uuid-1' } });
      expect(result).toEqual({
        accessToken: 'new-access-token',
        expiresIn: 900,
      });
    });

    it('should throw UnauthorizedException when refresh token JWT verification fails (expired or tampered)', async () => {
      jwtMock.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(authService.refresh(refreshDto)).rejects.toThrow(UnauthorizedException);
      await expect(authService.refresh(refreshDto)).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw UnauthorizedException when user no longer exists in DB', async () => {
      jwtMock.verify.mockReturnValue({ sub: 'user-uuid-1' });
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.refresh(refreshDto)).rejects.toThrow(UnauthorizedException);
      await expect(authService.refresh(refreshDto)).rejects.toThrow('Invalid refresh token');
    });

    it("should throw UnauthorizedException when stored refresh token doesn't match", async () => {
      jwtMock.verify.mockReturnValue({ sub: 'user-uuid-1' });
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshToken: 'a-different-stored-token',
      });

      await expect(authService.refresh(refreshDto)).rejects.toThrow(UnauthorizedException);
      await expect(authService.refresh(refreshDto)).rejects.toThrow('Invalid refresh token');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  //  LOGOUT
  // ═══════════════════════════════════════════════════════════════
  describe('logout', () => {
    it('should clear the refresh token from the database', async () => {
      prismaMock.user.update.mockResolvedValue({ ...mockUser, refreshToken: null });

      await expect(authService.logout('user-uuid-1')).resolves.toBeUndefined();

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: { refreshToken: null },
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  //  TOKEN GENERATION (indirectly tested through login/refresh)
  // ═══════════════════════════════════════════════════════════════
  describe('token generation properties', () => {
    it('should include user claims (sub, username, email, role) in the access token', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtMock.sign.mockReturnValueOnce('access-with-claims');
      jwtMock.sign.mockReturnValueOnce('refresh-for-user');
      prismaMock.user.update.mockResolvedValue({ ...mockUser, refreshToken: 'refresh-for-user' });

      await authService.login({ usernameOrEmail: 'testuser', password: 'correct123' });

      expect(jwtMock.sign).toHaveBeenNthCalledWith(
        1,
        { sub: mockUser.id, username: mockUser.username, email: mockUser.email, role: mockUser.role },
        { secret: process.env.JWT_ACCESS_SECRET, expiresIn: 900 },
      );
    });

    it('should store the refresh token in the database after login', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtMock.sign.mockReturnValueOnce('access-token');
      jwtMock.sign.mockReturnValueOnce('generated-refresh-token');
      prismaMock.user.update.mockResolvedValue({ ...mockUser, refreshToken: 'generated-refresh-token' });

      await authService.login({ usernameOrEmail: 'testuser', password: 'correct123' });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { refreshToken: 'generated-refresh-token' },
      });
    });

    it('should compute expiresIn from the environment variable (15m → 900s)', async () => {
      process.env.JWT_ACCESS_EXPIRES = '15m';
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtMock.sign.mockReturnValueOnce('access');
      jwtMock.sign.mockReturnValueOnce('refresh');
      prismaMock.user.update.mockResolvedValue({ ...mockUser, refreshToken: 'refresh' });

      const result = await authService.login({ usernameOrEmail: 'testuser', password: 'correct123' });
      expect(result.expiresIn).toBe(900); // 15 * 60
    });

    it('should accept hours token expiry (e.g. 1h → 3600s)', async () => {
      process.env.JWT_ACCESS_EXPIRES = '1h';
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtMock.sign.mockReturnValueOnce('access');
      jwtMock.sign.mockReturnValueOnce('refresh');
      prismaMock.user.update.mockResolvedValue({ ...mockUser, refreshToken: 'refresh' });

      const result = await authService.login({ usernameOrEmail: 'testuser', password: 'correct123' });
      expect(result.expiresIn).toBe(3600);
    });

    it('should default to 900s (15min) when JWT_ACCESS_EXPIRES is not set', async () => {
      delete process.env.JWT_ACCESS_EXPIRES;
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtMock.sign.mockReturnValueOnce('access');
      jwtMock.sign.mockReturnValueOnce('refresh');
      prismaMock.user.update.mockResolvedValue({ ...mockUser, refreshToken: 'refresh' });

      const result = await authService.login({ usernameOrEmail: 'testuser', password: 'correct123' });
      expect(result.expiresIn).toBe(900);
    });
  });
});
