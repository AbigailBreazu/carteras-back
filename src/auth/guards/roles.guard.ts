import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    console.log('🔐 RolesGuard - Usuario:', user);
    console.log('🔐 RolesGuard - Roles requeridos:', requiredRoles);

    if (!user) {
      console.log('❌ RolesGuard - No hay usuario en la petición');
      throw new ForbiddenException('No tienes permisos para acceder a este recurso');
    }

    const hasRole = requiredRoles.some((role) => user.rol === role);

    console.log('🔐 RolesGuard - Tiene rol?', hasRole);
    console.log('🔐 RolesGuard - user.rol:', user.rol);

    if (!hasRole) {
      console.log('❌ RolesGuard - Usuario no tiene el rol requerido');
      throw new ForbiddenException('No tienes permisos para acceder a este recurso');
    }

    return true;
  }
}
