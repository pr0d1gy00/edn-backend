import { JwtStrategy } from './jwt.strategy';
import { AccessTokenPayload } from './auth.service';
import { Role } from '@prisma/client';

describe('JwtStrategy', () => {
  beforeEach(() => {
    // The strategy constructor reads process.env.JWT_ACCESS_SECRET in super()
    process.env.JWT_ACCESS_SECRET = 'jwt-access-test-secret';
    jest.clearAllMocks();
  });

  // ── Strategy instantiation ──────────────────────────────────────
  describe('constructor', () => {
    it('should create an instance without throwing', () => {
      expect(() => new JwtStrategy()).not.toThrow();
    });
  });

  // ── validate ────────────────────────────────────────────────────
  describe('validate', () => {
    let strategy: JwtStrategy;

    const validPayload: AccessTokenPayload = {
      sub: 'user-uuid-99',
      username: 'janedoe',
      email: 'jane@example.com',
      role: 'ADMIN' as Role,
    };

    beforeEach(() => {
      strategy = new JwtStrategy();
    });

    it('should return the user object extracted from a valid JWT payload', async () => {
      const user = await strategy.validate(validPayload);

      expect(user).toEqual({
        id: 'user-uuid-99',
        username: 'janedoe',
        email: 'jane@example.com',
        role: 'ADMIN',
      });
    });

    it('should map sub → id correctly', async () => {
      const user = await strategy.validate({
        ...validPayload,
        sub: 'mapped-uuid',
      });

      expect(user.id).toBe('mapped-uuid');
    });

    it('should work with USER role payload', async () => {
      const user = await strategy.validate({
        ...validPayload,
        role: 'USER' as Role,
      });

      expect(user.role).toBe('USER');
    });

    it('should return all expected keys from the payload', async () => {
      const user = await strategy.validate(validPayload);

      const keys = Object.keys(user).sort();
      expect(keys).toEqual(['email', 'id', 'role', 'username']);
    });
  });
});
