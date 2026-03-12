import {FastifyInstance} from 'fastify';
import fastifyJwt from '@fastify/jwt';

export async function jwtPlugin(app: FastifyInstance) {
  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!,
  });

  // decorator para proteger rotas
  app.decorate('authenticate', async (req: any, reply: any) => {
    try {
      await req.jwtVerify();
    } catch {
      reply.status(401).send({error: 'Não autorizado'});
    }
  });
}