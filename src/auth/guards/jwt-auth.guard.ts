import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    console.log('🔐 JwtAuthGuard - Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.log('❌ JwtAuthGuard - No authorization header');
      throw new UnauthorizedException('No se proporcionó token de autenticación');
    }
    
    return super.canActivate(context);
  }
  
  handleRequest(err, user, info) {
    console.log('🔍 JwtAuthGuard - handleRequest:');
    console.log('  Error:', err);
    console.log('  User:', user);
    console.log('  Info:', info);
    
    if (err || !user) {
      console.log('❌ JwtAuthGuard - Acceso denegado');
      throw err || new UnauthorizedException('Token inválido o expirado');
    }
    
    console.log('✅ JwtAuthGuard - Usuario autenticado');
    return user;
  }
}
