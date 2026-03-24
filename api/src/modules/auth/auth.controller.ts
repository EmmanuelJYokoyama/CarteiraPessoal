import {FastifyRequest, FastifyReply} from 'fastify';
import {registerSchema, loginSchema, refreshSchema, initiateTwoFactorSchema, validateOtpSchema, confirmSmsSchema} from './auth.schema';
import {registerUser, loginUser, confirmUserViaSms, deleteUserById, generateTokens, refreshUserTokens, revokeRefreshToken, revokeAllUserTokens, initiateAccountConfirmation} from './auth.service';
import {initiateTwoFactor, validateOtp} from '../twoFactor/twoFactor.service';
import type {AuthTokenPayload} from './auth.types';

//registro de usuario

export async function register(req: FastifyRequest, reply: FastifyReply) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({error: parsed.error.flatten()});
  }

  try {
    const user = await registerUser(parsed.data);

    // Inicia o envio do código de confirmação via SMS
    await initiateAccountConfirmation(user.id, parsed.data.phoneNumber);

    return reply.status(201).send({
      userId: user.id,
      email: user.email,
      message: 'E-mail registrado. Verifique o SMS para o código de confirmação.',
    });

  } catch (err: any) {
    if (err.message === 'EMAIL_EXISTS') {
      return reply.status(409).send({error: 'E-mail já cadastrado'});
    }
    if (err.message === 'FAILED_TO_SEND_SMS') {
      return reply.status(502).send({error: 'Falha ao enviar SMS'});
    }
    if (typeof err.message === 'string' && err.message.startsWith('TWILIO_ERROR_')) {
      return reply.status(502).send({error: 'Erro ao enviar SMS'});
    }
    console.error('Erro no registro:', err);
    return reply.status(500).send({error: err.message});
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
    const tokens = await generateTokens(req.server, user.id, user.email);

    return reply.send(tokens);
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

// confirmacao de SMS

export async function confirmSms(req: FastifyRequest, reply: FastifyReply) {
  const parsed = confirmSmsSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({error: parsed.error.flatten()});
  }

  try {
    const user = await confirmUserViaSms(parsed.data.email, parsed.data.code);
    const tokens = await generateTokens(req.server, user.id, user.email);
    
    return reply.status(200).send({
      message: 'Conta confirmada com sucesso',
      ...tokens,
    });
  } catch (err: any) {
    if (err.message === 'USER_NOT_FOUND') {
      return reply.status(404).send({error: 'Usuário não encontrado'});
    }
    if (err.message === 'INVALID_CODE') {
      return reply.status(400).send({error: 'Código inválido'});
    }
    if (err.message === 'CODE_EXPIRED') {
      return reply.status(400).send({error: 'Código expirado'});
    }
    console.error('Erro ao confirmar via SMS:', err);
    return reply.status(500).send({error: 'Erro ao confirmar conta'});
  }
}

// reenviar codigo SMS

export async function resendConfirmationSms(
  req: FastifyRequest<{Body: {email: string}}>,
  reply: FastifyReply,
) {
  const body = req.body as {email?: string};
  
  if (!body.email) {
    return reply.status(400).send({error: 'E-mail é obrigatório'});
  }

  try {
    const user = await (await import('@db/index')).db.query.users.findFirst({
      where: (await import('drizzle-orm')).eq((await import('../../db/schema/users')).users.email, body.email),
    });

    if (!user) {
      return reply.status(404).send({error: 'Usuário não encontrado'});
    }

    if (!user.phoneNumber) {
      return reply.status(400).send({error: 'Telefone não cadastrado'});
    }

    if (user.isActive) {
      return reply.status(400).send({error: 'Conta já está ativada'});
    }

    await initiateAccountConfirmation(user.id, user.phoneNumber);

    return reply.status(200).send({
      message: 'Código reenviado com sucesso',
    });
  } catch (err: any) {
    if (err.message === 'FAILED_TO_SEND_SMS') {
      return reply.status(502).send({error: 'Falha ao enviar SMS'});
    }
    if (typeof err.message === 'string' && err.message.startsWith('TWILIO_ERROR_')) {
      return reply.status(502).send({error: 'Erro ao enviar SMS'});
    }
    console.error('Erro ao reenviar código:', err);
    return reply.status(500).send({error: 'Erro ao reenviar código'});
  }
}

//refresh token

export async function refresh(
  req: FastifyRequest<{Body: {refreshToken: string}}>,
  reply: FastifyReply,
) {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({error: parsed.error.flatten()});
  }

  try {
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

//logout

export async function logout(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
    
    const payload = req.user as AuthTokenPayload;
    const body = req.body as {refreshToken?: string};

    if (!body.refreshToken) {
      return reply.status(400).send({error: 'refreshToken é obrigatório'});
    }

    await revokeRefreshToken(payload.userId, body.refreshToken);
    return reply.send({message: 'Logout realizado com sucesso'});
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Token inválido'});
    }
    return reply.status(500).send({error: 'Erro ao fazer logout'});
  }
}

//logout em todos os dispositivos

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

//2fa

export async function initiateTwoFactorHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
    
    const parsed = initiateTwoFactorSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({error: parsed.error.flatten()});
    }

    const payload = req.user as AuthTokenPayload;
    const result = await initiateTwoFactor(payload.userId, parsed.data.phoneNumber);

    return reply.send(result);
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Token inválido'});
    }
    if (err.message === 'USER_NOT_FOUND') {
      return reply.status(404).send({error: 'Usuário não encontrado'});
    }
    if (err.message === 'FAILED_TO_SEND_SMS') {
      return reply.status(502).send({error: 'Falha ao enviar SMS'});
    }
    if (typeof err.message === 'string' && err.message.startsWith('TWILIO_ERROR_')) {
      return reply.status(502).send({error: 'Erro ao enviar SMS via Twilio'});
    }
    console.error('Erro ao iniciar 2FA:', err);
    return reply.status(500).send({error: 'Erro ao iniciar 2FA'});
  }
}

// validacao otp

export async function validateOtpHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
    
    const parsed = validateOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({error: parsed.error.flatten()});
    }

    const payload = req.user as AuthTokenPayload;
    const result = await validateOtp(payload.userId, parsed.data.code);

    return reply.send(result);
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Token inválido'});
    }
    if (err.message === 'INVALID_OTP') {
      return reply.status(401).send({error: 'Código OTP inválido'});
    }
    if (err.message === 'OTP_EXPIRED') {
      return reply.status(401).send({error: 'Código OTP expirado'});
    }
    console.error('Erro ao validar OTP:', err);
    return reply.status(500).send({error: 'Erro ao validar OTP'});
  }
}