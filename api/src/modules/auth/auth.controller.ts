import {FastifyRequest, FastifyReply} from 'fastify';
import {registerSchema, loginSchema, refreshSchema} from './auth.schema';
import {registerUser, loginUser, confirmUser, generateTokens, refreshUserTokens, revokeRefreshToken, revokeAllUserTokens} from './auth.service';
import type {AuthTokenPayload} from './auth.types';

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
    const tokens = await generateTokens(req.server, user.id, user.email);

    return reply.send(tokens);
  } catch (err: any) {
    console.error('Erro no login:', err); // Log do erro real
    if (err.message === 'INVALID_CREDENTIALS') {
      return reply.status(401).send({error: 'E-mail ou senha inválidos'});
    }
    if (err.message === 'ACCOUNT_NOT_CONFIRMED') {
      return reply.status(403).send({error: 'Confirme seu e-mail antes de entrar'});
    }
    return reply.status(500).send({error: err.message || 'Erro interno'});
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
    console.error('Erro ao confirmar conta:', err);
    return reply.status(500).send({error: 'Erro interno'});
  }
}

export async function refresh(
  req: FastifyRequest<{Body: {refreshToken: string}}>,
  reply: FastifyReply,
) {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({error: parsed.error.flatten()});
  }

  try {
    // Decodifica o refresh token para obter o userId
    const payload = req.server.jwt.verify(parsed.data.refreshToken) as AuthTokenPayload;
    
    const tokens = await refreshUserTokens(req.server, payload.userId, parsed.data.refreshToken);
    return reply.send(tokens);
  } catch (err: any) {
    if (err.message === 'INVALID_REFRESH_TOKEN' || err.message === 'invalid token') {
      return reply.status(401).send({error: 'Token de refresh inválido'});
    }
    if (err.message === 'REFRESH_TOKEN_EXPIRED') {
      return reply.status(401).send({error: 'Token de refresh expirado'});
    }
    if (err.message === 'USER_NOT_FOUND') {
      return reply.status(404).send({error: 'Usuário não encontrado'});
    }
    return reply.status(500).send({error: 'Erro ao renovar token'});
  }
}

/**
 * Endpoint para logout (revoga o refresh token)
 */
export async function logout(req: FastifyRequest, reply: FastifyReply) {
  try {
    // Requer autenticação
    await (req.server as any).authenticate(req, reply);
    
    const payload = req.user as AuthTokenPayload;
    const body = req.body as {refreshToken?: string};

    if (!body.refreshToken) {
      return reply.status(400).send({error: 'refreshToken é obrigatório'});
    }

    await revokeRefreshToken(payload.userId, body.refreshToken);
    return reply.send({message: 'Logout realizado com sucesso'});
  } catch (err: any) {
    if (err.message === 'INVALID_TOKEN') {
      return reply.status(401).send({error: 'Token inválido'});
    }
    return reply.status(500).send({error: 'Erro ao fazer logout'});
  }
}

/**
 * Endpoint para logout em todos os dispositivos
 * Revoga todos os refresh tokens do usuário
 */
export async function logoutAll(req: FastifyRequest, reply: FastifyReply) {
  try {
    // Requer autenticação
    await (req.server as any).authenticate(req, reply);
    
    const payload = req.user as AuthTokenPayload;
    await revokeAllUserTokens(payload.userId);
    
    return reply.send({message: 'Logout em todos os dispositivos realizado com sucesso'});
  } catch (err: any) {
    if (err.message === 'Não autorizado') {
      return reply.status(401).send({error: 'Não autorizado'});
    }
    return reply.status(500).send({error: 'Erro ao fazer logout'});
  }
}