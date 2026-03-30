import {FastifyRequest, FastifyReply} from 'fastify';
import {initiateTwoFactorSchema, validateOtpSchema} from './otp.schema';
import {initiateTwoFactor, validateOtp} from './otp.service';
import type {AuthTokenPayload} from '../auth/auth.types';

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
