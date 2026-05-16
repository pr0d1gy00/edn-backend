import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user?: { role?: Role }): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user: user ?? undefined }),
      }),
    } as unknown as ExecutionContext;
  }

  describe('canActivate', () => {
    it('should allow when user has matching ADMIN role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

      const context = createMockContext({ role: 'ADMIN' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny when user has USER role but ADMIN is required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

      const context = createMockContext({ role: 'USER' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow when user matches one of multiple required roles', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['ADMIN', 'MODERATOR' as Role]);

      const context = createMockContext({ role: 'ADMIN' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny when user has no role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

      const context = createMockContext();

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny when user object is present but role is missing', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

      const context = createMockContext({} as { role?: Role });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow request when no @Roles decorator is present', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = createMockContext({ role: 'USER' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow request when required roles array is empty', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      const context = createMockContext({ role: 'USER' });

      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
