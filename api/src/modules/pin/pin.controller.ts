import {FastifyRequest, FastifyReply} from 'fastify';
import {setPinSchema, validatePinSchema, loginWithPinSchema} from './pin.schema';
import {setUserPin, validateUserPin, validateUserPinByEmail} from './pin.service';
import type {AuthTokenPayload} from '../auth/auth.types';

export async function setPin(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
    
    const parsed = setPinSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({error: parsed.error.flatten()});
    }

    const payload = req.user as AuthTokenPayload;
    const result = await setUserPin(payload.userId, parsed.data.pin);

    return reply.status(200).send(result);
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Token inválido ou ausente'});
    }
    if (err.message === 'USER_NOT_FOUND') {
      return reply.status(404).send({error: 'Usuário não encontrado'});
    }
    console.error('Erro ao definir PIN:', err);
    return reply.status(500).send({error: 'Erro ao definir PIN'});
  }
}

export async function validatePin(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
    
    const parsed = validatePinSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({error: parsed.error.flatten()});
    }

    const payload = req.user as AuthTokenPayload;
    const isValid = await validateUserPin(payload.userId, parsed.data.pin);

    if (!isValid) {
      return reply.status(401).send({error: 'PIN incorreto'});
    }

    return reply.status(200).send({success: true, message: 'PIN validado com sucesso'});
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Token inválido ou ausente'});
    }
    if (err.message === 'USER_NOT_FOUND') {
      return reply.status(404).send({error: 'Usuário não encontrado'});
    }
    if (err.message === 'PIN_NOT_SET') {
      return reply.status(400).send({error: 'PIN não configurado para este usuário'});
    }
    console.error('Erro ao validar PIN:', err);
    return reply.status(500).send({error: 'Erro ao validar PIN'});
  }
}

export async function loginWithPin(req: FastifyRequest, reply: FastifyReply) {
  try {
    console.log('[PIN Login] Request received:', {
      body: req.body,
      timestamp: new Date().toISOString(),
    });

    const parsed = loginWithPinSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('[PIN Login] Validation failed:', parsed.error.flatten());
      return reply.status(400).send({error: parsed.error.flatten()});
    }

    const {email, pin} = parsed.data;
    console.log('[PIN Login] Validating PIN for email:', email);

    const user = await validateUserPinByEmail(email, pin);
    console.log('[PIN Login] PIN validated successfully for user:', user.userId);

    const token = await reply.jwtSign(
      {userId: user.userId, email: user.email},
      {expiresIn: '8h'}
    );

    console.log('[PIN Login] Token generated successfully');

    return reply.status(200).send({
      success: true,
      message: 'Login com PIN realizado com sucesso',
      token,
      user: {
        id: user.userId,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err: any) {
    console.error('[PIN Login] Error:', {
      message: err.message,
      stack: err.stack,
      type: err.constructor.name,
    });

    if (err.message === 'USER_NOT_FOUND') {
      return reply.status(404).send({error: 'Usuário não encontrado'});
    }
    if (err.message === 'PIN_NOT_SET') {
      return reply.status(400).send({error: 'PIN não configurado para este usuário'});
    }
    if (err.message === 'PIN_INVALID') {
      return reply.status(401).send({error: 'PIN incorreto'});
    }
    console.error('Erro ao fazer login com PIN:', err);
    return reply.status(500).send({error: 'Erro ao fazer login com PIN'});
  }
}
