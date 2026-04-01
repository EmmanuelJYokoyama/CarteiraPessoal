import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import * as dotenv from 'dotenv';
import { authRoutes } from '@modules/auth/auth.routes';
import { smsRoutes } from '@modules/sms/sms.routes';
import { otpRoutes } from '@modules/otp/otp.routes';
import { pinRoutes } from '@modules/pin/pin.routes';
import { cardsRoutes } from '@modules/cards/cards.routes';
import { transactionsRoutes } from '@modules/transactions/transactions.routes';

dotenv.config();

const app = Fastify({logger: true});

app.register(cors, {origin: true});
app.register(jwt, {secret: process.env.JWT_SECRET!});
app.register(authRoutes);
app.register(smsRoutes);
app.register(otpRoutes);
app.register(pinRoutes);
app.register(cardsRoutes);
app.register(transactionsRoutes);

app.get('/health', async () => ({status: 'ok'}));

app.get('/api/protected', async (req, res) => {
  try {
    await req.jwtVerify();
    return res.send({
      message: 'Acesso permitido!',
      user: req.user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(401).send({error: 'Não autorizado'});
  }
});

const start = async () => {
  try {
    await app.listen({
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0', // Accept connections from all interfaces
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();