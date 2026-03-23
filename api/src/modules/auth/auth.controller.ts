import {FastifyRequest, FastifyReply} from 'fastify';
import {registerSchema, loginSchema} from './auth.schema';
import {registerUser, loginUser, confirmUser, deleteUserById} from './auth.service';
import type {AuthTokenPayload, EmailConfirmTokenPayload} from './auth.types';
import {sendConfirmationEmail} from '@plugins/sendgrid';

export async function register(req: FastifyRequest, reply: FastifyReply) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({error: parsed.error.flatten()});
  }

  const confirmToken = req.server.jwt.sign(
    {
      email: parsed.data.email,
      purpose: 'email-confirmation',
    } as EmailConfirmTokenPayload,
    {expiresIn: '24h'},
  );

  try {
    const {user} = await registerUser(parsed.data, confirmToken);

    const appBaseUrl = process.env.APP_BASE_URL ?? `http://localhost:${process.env.PORT ?? '3000'}`;
    const confirmLink = `${appBaseUrl}/auth/confirm/${confirmToken}`;

    try {
      await sendConfirmationEmail({
        to: parsed.data.email,
        name: parsed.data.name,
        confirmLink,
      });
    } catch (emailErr) {
      await deleteUserById(user.id);
      throw emailErr;
    }

    return reply.status(201).send({
      userId: user.id,
      message: 'Cadastro realizado. Verifique seu e-mail para ativar a conta.',
    });
  } catch (err: any) {
    if (err.message === 'EMAIL_EXISTS') {
      return reply.status(409).send({error: 'E-mail já cadastrado'});
    }
    if (typeof err.message === 'string' && err.message.startsWith('MISSING_ENV_')) {
      return reply.status(500).send({error: 'Configuração de e-mail incompleta no servidor'});
    }
    if (typeof err.message === 'string' && err.message.startsWith('SENDGRID_ERROR_')) {
      return reply.status(502).send({error: 'Falha ao enviar e-mail de confirmação'});
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
    const payload = await req.server.jwt.verify<EmailConfirmTokenPayload>(req.params.token);
    if (payload.purpose !== 'email-confirmation') {
      throw new Error('INVALID_TOKEN');
    }

    await confirmUser(payload.email, req.params.token);
    return reply.send({message: 'Conta confirmada com sucesso'});
  } catch (err: any) {
    if (err.message === 'INVALID_TOKEN' || err.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
      return reply.status(400).send({error: 'Token inválido ou expirado'});
    }
    return reply.status(500).send({error: 'Erro interno'});
  }
}