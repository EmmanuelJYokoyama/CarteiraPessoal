import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import * as dotenv from 'dotenv';

dotenv.config();

const app = Fastify({logger: true});

app.register(cors, {origin: true});
app.register(jwt, {secret: process.env.JWT_SECRET!});

app.get('/health', async () => ({status: 'ok'}));

const start = async () => {
  try {
    await app.listen({port: Number(process.env.PORT) || 3000});
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();