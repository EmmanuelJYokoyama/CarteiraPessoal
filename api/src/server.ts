import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import * as dotenv from 'dotenv';
import { authRoutes } from '@modules/auth/auth.routes';
import { smsRoutes } from '@modules/sms/sms.routes';
import { otpRoutes } from '@modules/otp/otp.routes';
import { pinRoutes } from '@modules/pin/pin.routes';
import { cardsRoutes } from '@modules/cards/cards.routes';
import { transactionsRoutes } from '@modules/transactions/transactions.routes';
import { transactionsAiRoutes } from '@modules/transactions/transactions-ai.routes';
import { categoriesRoutes } from '@modules/categories/categories.routes';
import { cardLimitAlertsRoutes } from '@modules/cardLimitAlerts/cardLimitAlerts.routes';
import { statementsRoutes } from '@modules/statements/statements.routes';
import { budgetsRoutes } from '@modules/budgets/budgets.routes';
import { locationRoutes } from '@modules/location/location.routes';
import { swaggerConfig, swaggerUIConfig } from '@/swagger.config';

dotenv.config();

console.log('=== API Server Starting ===');

const app = Fastify({logger: true});

app.register(cors, {origin: true});
app.register(jwt, {secret: process.env.JWT_SECRET!});

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

app.register(swagger, swaggerConfig);
app.register(swaggerUI, swaggerUIConfig);
app.register(authRoutes);
app.register(smsRoutes);
app.register(otpRoutes);
app.register(pinRoutes);
app.register(cardsRoutes);
app.register(categoriesRoutes);
app.register(transactionsRoutes);
app.register(transactionsAiRoutes);
app.register(cardLimitAlertsRoutes);
app.register(statementsRoutes);
app.register(budgetsRoutes);
app.register(locationRoutes);

app.get('/health', async (req, reply) => {
  reply.send({status: 'ok', timestamp: new Date().toISOString()});
});

app.get('/debug', async (req, reply) => {
  return reply.send({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      port: process.env.PORT || 3000,
      hasDatabase: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
    },
  });
});

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
    console.log('Starting server...');
    console.log('PORT:', process.env.PORT || 3000);
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ configured' : '✗ not configured');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ configured' : '✗ not configured');

    await app.listen({
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0',
    });
    
    console.log(`✓ Server listening at http://0.0.0.0:${process.env.PORT || 3000}`);
  } catch (err) {
    console.error('✗ Server startup error:', err);
    app.log.error(err);
    process.exit(1);
  }
};

start();