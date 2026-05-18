import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    console.log(requiredRoles);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    console.log('--- DEBUG ROLES GUARD ---');
    console.log('Required Roles:', requiredRoles);
    console.log('Auth Header:', request.headers.authorization);
    console.log('User from Request:', user);

    // Resolve user role: first from request.user (JWT/auth middleware), fallback to X-User-Role header
    const userRole: string | undefined =
      user?.role || request.headers['x-user-role'];

    console.log('Resolved User Role:', userRole);
    console.log('-------------------------');

    if (!userRole) {
      throw new ForbiddenException('Access denied: user role not available');
    }

    const hasRole = requiredRoles.some((role) => userRole === role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: requires one of roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
