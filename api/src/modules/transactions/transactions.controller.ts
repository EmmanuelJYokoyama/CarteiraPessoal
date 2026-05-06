import {FastifyRequest, FastifyReply} from 'fastify';
import {createTransactionSchema, updateTransactionSchema, payInstallmentSchema, duplicateCheckSchema} from './transactions.schema';
import {createTransaction, getTransactionsByUserId, getTransactionById, updateTransaction, deleteTransaction, payInstallment, findDuplicateTransactions} from './transactions.service';
import type {AuthTokenPayload} from '../auth/auth.types';

export async function createNewTransaction(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch {
    return reply.status(401).send({error: 'Unauthorized'});
  }

  const user = req.user as AuthTokenPayload;

  try {
    const input = createTransactionSchema.parse(req.body);
    const result = await createTransaction(user.userId, input);
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
    const updated = await updateTransaction(transactionId, user.userId, input);
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
