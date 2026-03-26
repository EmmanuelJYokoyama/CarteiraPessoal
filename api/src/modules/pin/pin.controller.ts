import {FastifyRequest, FastifyReply} from 'fastify';
import {setPinSchema, validatePinSchema} from './pin.schema';
import {setUserPin, validateUserPin} from './pin.service';
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
