import {FastifyInstance} from 'fastify';
import {register, login, refresh, logout, logoutAll} from './auth.controller';

export async function authRoutes(app: FastifyInstance) {
  // Autenticação básica
  app.post('/auth/register', register);
  app.post('/auth/login',    login);
  
  // Gerenciamento de tokens
  app.post('/auth/refresh',  refresh);
  app.post('/auth/logout',   logout);
  app.post('/auth/logout-all', logoutAll);
}