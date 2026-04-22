import {FastifyInstance} from 'fastify';
import fastifyJwt from '@fastify/jwt';

export async function jwtPlugin(app: FastifyInstance) {
  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!,
  });

  app.decorate('authenticate', async (req: any, reply: any) => {
    try {
      await req.jwtVerify();
    } catch {
      reply.status(401).send({error: 'Não autorizado'});
    }
  });

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