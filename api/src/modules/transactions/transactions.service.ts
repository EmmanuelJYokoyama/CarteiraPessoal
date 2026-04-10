import {db} from '@db/index';
import {transactions, installments} from '../../db/schema/transactions';
import {eq, and, isNull} from 'drizzle-orm';
import type {CreateTransactionInput, UpdateTransactionInput, PayInstallmentInput} from './transactions.schema';

export async function createTransaction(userId: string, input: CreateTransactionInput) {
  const transactionDate = input.transactionDate instanceof Date 
    ? input.transactionDate 
    : new Date(input.transactionDate);

  const amount = Number(input.amount);
  const installmentCount = input.installments || 1;
  const amountPerInstallment = (amount / installmentCount).toFixed(2);

  return await db.transaction(async (tx) => {
    // Criar a transação principal (primeira parcela)
    const newTransactionResult = await tx
      .insert(transactions)
      .values({
        userId,
        cardId: input.cardId,
        description: input.description,
        amount: amount.toString(),
        installments: installmentCount,
        installmentsPaid: 0,
        category: input.category,
        status: 'pending',
        transactionDate,
      })
      .returning();

    const newTransaction = Array.isArray(newTransactionResult) 
      ? newTransactionResult[0] 
      : newTransactionResult;

    // Criar registros de parcelas
    const installmentsToCreate = Array.from({length: installmentCount}, (_, i) => {
      const dueDate = new Date(transactionDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      dueDate.setDate(1);

      return {
        transactionId: newTransaction.id,
        installmentNumber: i + 1,
        amount: amountPerInstallment,
        dueDate,
        status: 'pending' as const,
      };
    });

    const createdInstallmentsResult = await tx
      .insert(installments)
      .values(installmentsToCreate)
      .returning();

    const createdInstallments = Array.isArray(createdInstallmentsResult) 
      ? createdInstallmentsResult 
      : [createdInstallmentsResult];

    return {
      transaction: newTransaction,
      installments: createdInstallments,
    };
  });
}

export async function getTransactionsByUserId(userId: string) {
  const userTransactions = await db.query.transactions.findMany({
    where: and(
      eq(transactions.userId, userId),
      isNull(transactions.parentTransactionId)
    ),
  });

  return userTransactions;
}

export async function getTransactionById(transactionId: string, userId: string) {
  const transaction = await db.query.transactions.findFirst({
    where: and(
      eq(transactions.id, transactionId),
      eq(transactions.userId, userId)
    ),
  });

  if (!transaction) throw new Error('TRANSACTION_NOT_FOUND');

  const transactionInstallments = await db.query.installments.findMany({
    where: eq(installments.transactionId, transactionId),
  });

  return {
    transaction,
    installments: transactionInstallments,
  };
}

export async function updateTransaction(transactionId: string, userId: string, input: UpdateTransactionInput) {
  const transaction = await db.query.transactions.findFirst({
    where: and(
      eq(transactions.id, transactionId),
      eq(transactions.userId, userId)
    ),
  });

  if (!transaction) throw new Error('TRANSACTION_NOT_FOUND');

  const updatedResult = await db
    .update(transactions)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(transactions.id, transactionId))
    .returning();

  const updated = Array.isArray(updatedResult) 
    ? updatedResult[0] 
    : updatedResult;

  return updated;
}

export async function deleteTransaction(transactionId: string, userId: string) {
  const transaction = await db.query.transactions.findFirst({
    where: and(
      eq(transactions.id, transactionId),
      eq(transactions.userId, userId)
    ),
  });

  if (!transaction) throw new Error('TRANSACTION_NOT_FOUND');

  // Deletar a transação (vai deletar lançamentos futuros automaticamente através da foreign key cascade)
  await db.delete(transactions).where(eq(transactions.id, transactionId));
}

export async function payInstallment(installmentId: string, userId: string) {
  const installment = await db.query.installments.findFirst({
    where: eq(installments.id, installmentId),
  });

  if (!installment) throw new Error('INSTALLMENT_NOT_FOUND');

  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, installment.transactionId),
  });

  if (!transaction || transaction.userId !== userId) {
    throw new Error('UNAUTHORIZED');
  }

  const now = new Date();
  const updatedInstallmentResult = await db
    .update(installments)
    .set({
      status: 'completed',
      paidAt: now,
    })
    .where(eq(installments.id, installmentId))
    .returning();

  const updated = Array.isArray(updatedInstallmentResult) 
    ? updatedInstallmentResult[0] 
    : updatedInstallmentResult;

  const remainingInstallments = await db.query.installments.findMany({
    where: and(
      eq(installments.transactionId, installment.transactionId),
      eq(installments.status, 'pending')
    ),
  });

  if (remainingInstallments.length === 0) {
    await db
      .update(transactions)
      .set({
        status: 'completed',
        installmentsPaid: transaction.installments,
        updatedAt: now,
      })
      .where(eq(transactions.id, installment.transactionId));
  } else {
    const paidCount = transaction.installmentsPaid + 1;
    await db
      .update(transactions)
      .set({
        installmentsPaid: paidCount,
        updatedAt: now,
      })
      .where(eq(transactions.id, installment.transactionId));
  }

  return updated;
}
