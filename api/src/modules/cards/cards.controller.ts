import {FastifyRequest, FastifyReply} from 'fastify';
import {createCardSchema, updateCardSchema} from './cards.schema';
import {
  createCard,
  getCardsByUserId,
  getCardById,
  updateCard,
  deleteCard,
} from './cards.service';
import type {AuthTokenPayload} from '../auth/auth.types';

export async function listCards(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();

    const payload = req.user as AuthTokenPayload;
    console.log('[Cards] Listing cards for user:', payload.userId);
    
    const userCards = await getCardsByUserId(payload.userId);

    console.log('[Cards] Found cards:', userCards.length);
    return reply.send(userCards);
  } catch (err: any) {
    console.error('[Cards] Error listing cards:', {
      message: err.message,
      stack: err.stack,
      type: err.constructor.name,
    });
    
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Token inválido ou ausente'});
    }
    console.error('Erro ao listar cartões:', err);
    return reply.status(500).send({error: 'Erro ao listar cartões'});
  }
}

export async function createNewCard(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();

    console.log('[Cards] Creating card with body:', JSON.stringify(req.body));

    const parsed = createCardSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('[Cards] Validation errors:', parsed.error.flatten());
      return reply.status(400).send({error: parsed.error.flatten()});
    }

    console.log('[Cards] Parsed data:', JSON.stringify(parsed.data));
    const payload = req.user as AuthTokenPayload;
    const card = await createCard(payload.userId, parsed.data);
    console.log('[Cards] Card created:', JSON.stringify(card));

    return reply.status(201).send(card);
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Token inválido ou ausente'});
    }
    console.error('Erro ao criar cartão:', err);
    return reply.status(500).send({error: 'Erro ao criar cartão'});
  }
}

export async function getCard(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();

    const {cardId} = req.params as {cardId: string};
    const payload = req.user as AuthTokenPayload;

    const card = await getCardById(cardId, payload.userId);

    return reply.send(card);
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Token inválido ou ausente'});
    }
    if (err.message === 'CARD_NOT_FOUND') {
      return reply.status(404).send({error: 'Cartão não encontrado'});
    }
    console.error('Erro ao obter cartão:', err);
    return reply.status(500).send({error: 'Erro ao obter cartão'});
  }
}

export async function updateCardHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();

    const parsed = updateCardSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({error: parsed.error.flatten()});
    }

    const {cardId} = req.params as {cardId: string};
    const payload = req.user as AuthTokenPayload;

    const updated = await updateCard(cardId, payload.userId, parsed.data);

    return reply.send(updated);
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Token inválido ou ausente'});
    }
    if (err.message === 'CARD_NOT_FOUND') {
      return reply.status(404).send({error: 'Cartão não encontrado'});
    }
    console.error('Erro ao atualizar cartão:', err);
    return reply.status(500).send({error: 'Erro ao atualizar cartão'});
  }
}

export async function deleteCardHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();

    const {cardId} = req.params as {cardId: string};
    const payload = req.user as AuthTokenPayload;

    const result = await deleteCard(cardId, payload.userId);

    return reply.send(result);
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Token inválido ou ausente'});
    }
    if (err.message === 'CARD_NOT_FOUND') {
      return reply.status(404).send({error: 'Cartão não encontrado'});
    }
    console.error('Erro ao deletar cartão:', err);
    return reply.status(500).send({error: 'Erro ao deletar cartão'});
  }
}
