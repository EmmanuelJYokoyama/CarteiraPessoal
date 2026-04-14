import {FastifyRequest, FastifyReply} from 'fastify';
import {
  getCardBillingStatement,
  getUserBillingStatements,
  getCardStatementByCategory,
} from './cards.billing.service';
import type {AuthTokenPayload} from '../auth/auth.types';

export async function getCardBillingStatementHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await req.jwtVerify();

    const payload = req.user as AuthTokenPayload;
    const {cardId} = req.params as {cardId: string};

    const statement = await getCardBillingStatement(cardId, payload.userId);

    return reply.send(statement);
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Token inválido ou ausente'});
    }
    if (err.message === 'CARD_NOT_FOUND') {
      return reply.status(404).send({error: 'Cartão não encontrado'});
    }
    console.error('Erro ao buscar fatura:', err);
    return reply.status(500).send({error: 'Erro ao buscar fatura'});
  }
}

export async function getUserBillingStatementsHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await req.jwtVerify();

    const payload = req.user as AuthTokenPayload;
    const statements = await getUserBillingStatements(payload.userId);

    return reply.send(statements);
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Token inválido ou ausente'});
    }
    console.error('Erro ao buscar faturas:', err);
    return reply.status(500).send({error: 'Erro ao buscar faturas'});
  }
}

export async function getCardStatementByCategoryHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await req.jwtVerify();

    const payload = req.user as AuthTokenPayload;
    const {cardId} = req.params as {cardId: string};

    const categories = await getCardStatementByCategory(cardId, payload.userId);

    return reply.send(categories);
  } catch (err: any) {
    if (err.message?.includes('jwt')) {
      return reply.status(401).send({error: 'Token inválido ou ausente'});
    }
    if (err.message === 'CARD_NOT_FOUND') {
      return reply.status(404).send({error: 'Cartão não encontrado'});
    }
    console.error('Erro ao buscar gastos por categoria:', err);
    return reply.status(500).send({error: 'Erro ao buscar gastos por categoria'});
  }
}
