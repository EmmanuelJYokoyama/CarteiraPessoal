export interface JwtPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

declare global {
  namespace FastifyJwt {
    interface FastifyJwtPayload extends JwtPayload {}
  }
}

declare module 'fastify' {
  import {FastifyRequest, FastifyReply} from 'fastify';
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authenticateRefresh: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
