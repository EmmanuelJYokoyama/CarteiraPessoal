import {FastifyRequest, FastifyReply} from 'fastify';
import {registerSchema, loginSchema, refreshSchema} from './auth.schema';
import {registerUser, loginUser, generateTokens, refreshUserTokens, revokeRefreshToken, revokeAllUserTokens} from './auth.service';
import {initiateSmsSending} from '../sms/sms.service';
import {seedUserCategories} from '@utils/seedCategories';
import type {AuthTokenPayload} from './auth.types';

//registro de usuario

export async function register(req: FastifyRequest, reply: FastifyReply) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({error: parsed.error.flatten()});
  }

  try {
    console.log(`👤 Registrando novo usuário: ${parsed.data.email}`);
    const user = await registerUser(parsed.data);
    console.log(`✅ Usuário criado: ${user.id}`);

    // Seed categorias padrão para novo usuário
    await seedUserCategories(user.id);
    console.log(`✅ Categorias padrão criadas`);

    // Inicia o envio do código de confirmação via SMS
    console.log(`📱 Iniciando envio de SMS para: ${parsed.data.phoneNumber}`);
    await initiateSmsSending(user.id, parsed.data.phoneNumber);
    console.log(`✅ SMS iniciado com sucesso`);

    return reply.status(201).send({
      userId: user.id,
      email: user.email,
      message: 'E-mail registrado. Verifique o SMS para o código de confirmação.',
    });

  } catch (err: any) {
    console.error('❌ Erro no registro:', err);
    if (err.message === 'EMAIL_EXISTS') {
      return reply.status(409).send({error: 'E-mail já cadastrado'});
    }
    if (err.message === 'FAILED_TO_SEND_SMS') {
      return reply.status(502).send({error: 'Falha ao enviar SMS. Verifique as credenciais do Twilio.'});
    }
    if (typeof err.message === 'string' && err.message.startsWith('TWILIO_ERROR_')) {
      return reply.status(502).send({error: `Erro Twilio: ${err.message}`});
    }
    return reply.status(500).send({error: err.message || 'Erro ao registrar usuário'});
  }
}

// login

export async function login(req: FastifyRequest, reply: FastifyReply) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({error: parsed.error.flatten()});
  }

  try {
    const user = await loginUser(parsed.data);
    
    // Seed categorias padrão se o usuário não tiver nenhuma
    await seedUserCategories(user.id);
    
    const tokens = await generateTokens(req.server, user.id, user.email);

    return reply.send({
      ...tokens,
      name: user.name,
      email: user.email,
    });
  } catch (err: any) {
    console.error('Erro no login:', err); 
    if (err.message === 'INVALID_CREDENTIALS') {
      return reply.status(401).send({error: 'E-mail ou senha inválidos'});
    }
    if (err.message === 'ACCOUNT_NOT_CONFIRMED') {
      return reply.status(403).send({error: 'Confirme seu e-mail antes de entrar'});
    }
    return reply.status(500).send({error: err.message || 'Erro interno'});
  }
}

// refresh token

export async function refresh(req: FastifyRequest, reply: FastifyReply) {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({error: parsed.error.flatten()});
  }

  try {
    await req.jwtVerify();
    const payload = req.user as AuthTokenPayload;
    
    const tokens = await refreshUserTokens(req.server, payload.userId, parsed.data.refreshToken);
    return reply.send(tokens);
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Não autorizado'});
    }
    if (err.message === 'INVALID_REFRESH_TOKEN') {
      return reply.status(401).send({error: 'Token de refresh inválido'});
    }
    if (err.message === 'REFRESH_TOKEN_EXPIRED') {
      return reply.status(401).send({error: 'Token de refresh expirado'});
    }
    if (err.message === 'USER_NOT_FOUND') {
      return reply.status(404).send({error: 'Usuário não encontrado'});
    }
    return reply.status(500).send({error: err.message || 'Erro interno'});
  }
}

// logout do dispositivo atual

export async function logout(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
    
    const payload = req.user as AuthTokenPayload;
    const parsed = refreshSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return reply.status(400).send({error: parsed.error.flatten()});
    }

    await revokeRefreshToken(payload.userId, parsed.data.refreshToken);
    
    return reply.send({message: 'Logout realizado com sucesso'});
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Não autorizado'});
    }
    if (err.message === 'INVALID_TOKEN') {
      return reply.status(401).send({error: 'Token inválido'});
    }
    return reply.status(500).send({error: 'Erro ao fazer logout'});
  }
}

export async function logoutAll(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
    
    const payload = req.user as AuthTokenPayload;
    await revokeAllUserTokens(payload.userId);
    
    return reply.send({message: 'Logout em todos os dispositivos realizado com sucesso'});
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Não autorizado'});
    }
    return reply.status(500).send({error: 'Erro ao fazer logout'});
  }
}