import {FastifyInstance} from 'fastify';
import {register, confirm, login} from './auth.controller';

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', register);
  app.post('/auth/login',    login);
  app.get( '/auth/confirm/:token', confirm);
}