import {FastifyInstance} from 'fastify';
import {register, confirm, login, refresh, logout, logoutAll} from './auth.controller';

export async function authRoutes(app: FastifyInstance) {
  // Autenticação básica
  app.post('/auth/register', register);
  app.post('/auth/login',    login);
  app.get( '/auth/confirm/:token', confirm);
  
  // Gerenciamento de tokens
  app.post('/auth/refresh',  refresh);       // Renovar access token
  app.post('/auth/logout',   logout);        // Logout (revoga um refresh token)
  app.post('/auth/logout-all', logoutAll);   // Logout em todos os dispositivos
}