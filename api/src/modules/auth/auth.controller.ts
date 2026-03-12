import {FastifyRequest, FastifyReply} from 'fastify';
import {registerSchema, loginSchema} from './auth.schema';
import {registerUser, loginUser, confirmUser} from './auth.service';
import type {AuthTokenPayload} from './auth.types';
import { ca } from 'zod/locales';

export async function register(req: FastifyRequest, reply: FastifyReply) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({error: parsed.error.flatten()});
  }

  try {
    const {user, confirmToken} = await registerUser(parsed.data);
    //sendgrid entra aqui
    return reply.status(201).send({userId: user.id, confirmToken});
  } catch (err: any) {
    if (err.message === 'EMAIL_EXISTS') {
      return reply.status(409).send({error: 'E-mail já cadastrado'});
    }
    return reply.status(500).send({error: err.message});
  }
}

export async function login(req: FastifyRequest, reply: FastifyReply) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({error: parsed.error.flatten()});
  }

  try {
    const user = await loginUser(parsed.data);
    const payload: AuthTokenPayload = {userId: user.id, email: user.email};

    const accessToken  = req.server.jwt.sign(payload, {expiresIn: '15m'});
    const refreshToken = req.server.jwt.sign(payload, {expiresIn: '7d'});

    return reply.send({accessToken, refreshToken});
  } catch (err: any) {
    if (err.message === 'INVALID_CREDENTIALS') {
      return reply.status(401).send({error: 'E-mail ou senha inválidos'});
    }
    if (err.message === 'ACCOUNT_NOT_CONFIRMED') {
      return reply.status(403).send({error: 'Confirme seu e-mail antes de entrar'});
    }
    return reply.status(500).send({error: 'Erro interno'});
  }
}

export async function confirm(
  req: FastifyRequest<{Params: {token: string}}>,
  reply: FastifyReply,
) {
  try {
    await confirmUser(req.params.token);
    return reply.send({message: 'Conta confirmada com sucesso'});
  } catch (err: any) {
    if (err.message === 'INVALID_TOKEN') {
      return reply.status(400).send({error: 'Token inválido ou expirado'});
    }
    return reply.status(500).send({error: 'Erro interno'});
  }
}