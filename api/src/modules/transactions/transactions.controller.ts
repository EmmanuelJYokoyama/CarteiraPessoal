import {FastifyRequest, FastifyReply} from 'fastify';
import {createTransactionSchema, updateTransactionSchema, payInstallmentSchema, duplicateCheckSchema} from './transactions.schema';
import {createTransaction, getTransactionsByUserId, getTransactionById, updateTransaction, deleteTransaction, payInstallment, findDuplicateTransactions} from './transactions.service';
import type {AuthTokenPayload} from '../auth/auth.types';
import {checkAndNotifyCardLimitAlert} from '@modules/cardLimitAlerts/cardLimitAlerts.notifications';
import {getCardLimitStatus} from '@modules/cardLimitAlerts/cardLimitAlerts.service';

export async function createNewTransaction(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch {
    return reply.status(401).send({error: 'Unauthorized'});
  }

  const user = req.user as AuthTokenPayload;

  try {
    const input = createTransactionSchema.parse(req.body);
    const beforeAlert = input.cardId
      ? await getCardLimitStatus(input.cardId, user.userId)
      : null;

    const result = await createTransaction(user.userId, input);
    
    const afterAlert = result.transaction.cardId
      ? await getCardLimitStatus(result.transaction.cardId, user.userId)
      : null;

    // Send only when this transaction pushes the card past the alert threshold
    try {
      if (
        result.transaction.cardId &&
        (!beforeAlert?.shouldAlert && afterAlert?.shouldAlert)
      ) {
        await checkAndNotifyCardLimitAlert(user.userId, result.transaction.cardId);
      }
    } catch (alertError) {
      console.error('⚠️ Erro ao verificar alertas de limite:', alertError);
      // Don't fail the transaction creation if alerts fail
    }
    
    return reply.status(201).send(result);
  } catch (error: any) {
    return reply.status(400).send({error: error.message});
  }
}

export async function listTransactions(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch {
    return reply.status(401).send({error: 'Unauthorized'});
  }

  const user = req.user as AuthTokenPayload;

  try {
    console.log('[Transactions] Fetching transactions for user:', user.userId);
    const userTransactions = await getTransactionsByUserId(user.userId);
    console.log('[Transactions] Found transactions:', userTransactions.length);
    return reply.send(userTransactions);
  } catch (error: any) {
    console.error('[Transactions] Error:', error);
    return reply.status(500).send({error: error.message});
  }
}

export async function checkDuplicateTransactions(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch {
    return reply.status(401).send({error: 'Unauthorized'});
  }

  const user = req.user as AuthTokenPayload;

  try {
    const input = duplicateCheckSchema.parse(req.body);
    const duplicates = await findDuplicateTransactions(user.userId, input);
    return reply.send({
      count: duplicates.length,
      duplicates,
    });
  } catch (error: any) {
    return reply.status(400).send({error: error.message});
  }
}

export async function getTransaction(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch {
    return reply.status(401).send({error: 'Unauthorized'});
  }

  const user = req.user as AuthTokenPayload;
  const {transactionId} = req.params as {transactionId: string};

  try {
    const result = await getTransactionById(transactionId, user.userId);
    return reply.send(result);
  } catch (error: any) {
    if (error.message === 'TRANSACTION_NOT_FOUND') {
      return reply.status(404).send({error: 'Transaction not found'});
    }
    return reply.status(500).send({error: error.message});
  }
}

export async function updateTransactionHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch {
    return reply.status(401).send({error: 'Unauthorized'});
  }

  const user = req.user as AuthTokenPayload;
  const {transactionId} = req.params as {transactionId: string};

  try {
    const input = updateTransactionSchema.parse(req.body);
    const existing = await getTransactionById(transactionId, user.userId);
    const cardId = existing.transaction.cardId;
    const beforeAlert = cardId ? await getCardLimitStatus(cardId, user.userId) : null;

    const updated = await updateTransaction(transactionId, user.userId, input);
    const afterAlert = updated.cardId ? await getCardLimitStatus(updated.cardId, user.userId) : null;
    
    // Send only when this update pushes the card past the alert threshold
    if (updated.cardId && (!beforeAlert?.shouldAlert && afterAlert?.shouldAlert)) {
      try {
        await checkAndNotifyCardLimitAlert(user.userId, updated.cardId);
      } catch (alertError) {
        console.error('⚠️ Erro ao verificar alertas de limite:', alertError);
        // Don't fail the transaction update if alerts fail
      }
    }
    
    return reply.send({transaction: updated});
  } catch (error: any) {
    if (error.message === 'TRANSACTION_NOT_FOUND') {
      return reply.status(404).send({error: 'Transaction not found'});
    }
    return reply.status(400).send({error: error.message});
  }
}

export async function deleteTransactionHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch {
    return reply.status(401).send({error: 'Unauthorized'});
  }

  const user = req.user as AuthTokenPayload;
  const {transactionId} = req.params as {transactionId: string};

  try {
    await deleteTransaction(transactionId, user.userId);
    return reply.send({message: 'Transaction deleted'});
  } catch (error: any) {
    if (error.message === 'TRANSACTION_NOT_FOUND') {
      return reply.status(404).send({error: 'Transaction not found'});
    }
    return reply.status(500).send({error: error.message});
  }
}

export async function payInstallmentHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch {
    return reply.status(401).send({error: 'Unauthorized'});
  }

  const user = req.user as AuthTokenPayload;

  try {
    const input = payInstallmentSchema.parse(req.body);
    const paid = await payInstallment(input.installmentId, user.userId);
    return reply.send({installment: paid});
  } catch (error: any) {
    if (error.message === 'INSTALLMENT_NOT_FOUND') {
      return reply.status(404).send({error: 'Installment not found'});
    }
    if (error.message === 'UNAUTHORIZED') {
      return reply.status(403).send({error: 'Forbidden'});
    }
    return reply.status(400).send({error: error.message});
  }
}
