import {FastifyInstance} from 'fastify';
import fastifyJwt from '@fastify/jwt';

export async function jwtPlugin(app: FastifyInstance) {
  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!,
  });

  // decorator para proteger rotas com access token
  app.decorate('authenticate', async (req: any, reply: any) => {
    try {
      await req.jwtVerify();
    } catch {
      reply.status(401).send({error: 'Não autorizado'});
    }
  });

  // decorator para refresh token
  app.decorate('authenticateRefresh', async (req: any, reply: any) => {
    try {
      await req.jwtVerify();
      const payload = req.user as any;
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
    } catch {
      reply.status(401).send({error: 'Token de refresh inválido'});
    }
  });
}