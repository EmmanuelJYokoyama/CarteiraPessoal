import {db} from '@db/index';
import {transactions, installments} from '../../db/schema/transactions';
import {eq, and, isNull, gte, lte, ilike} from 'drizzle-orm';
import type {CreateTransactionInput, UpdateTransactionInput, PayInstallmentInput, DuplicateCheckInput} from './transactions.schema';

export async function createTransaction(userId: string, input: CreateTransactionInput) {
  const transactionDate = input.transactionDate instanceof Date 
    ? input.transactionDate 
    : new Date(input.transactionDate);

  const amount = Number(input.amount);
  const installmentCount = input.installments || 1;
  const amountPerInstallment = (amount / installmentCount).toFixed(2);

  return await db.transaction(async (tx) => {
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

  console.log('[TransactionService] Found transactions:', userTransactions.length);
  
  // Enrich transactions with their installments
  const transactionsWithInstallments = await Promise.all(
    userTransactions.map(async (tx) => {
      const txInstallments = await db.query.installments.findMany({
        where: eq(installments.transactionId, tx.id),
      });
      
      return {
        ...tx,
        installmentDetails: txInstallments,
      };
    })
  );

  return transactionsWithInstallments;
}

export async function findDuplicateTransactions(
  userId: string,
  input: DuplicateCheckInput
) {
  const rawDate = input.transactionDate instanceof Date
    ? input.transactionDate
    : new Date(input.transactionDate);

  const startDate = new Date(rawDate);
  startDate.setDate(startDate.getDate() - 3);

  const endDate = new Date(rawDate);
  endDate.setDate(endDate.getDate() + 3);

  const amount = Number(input.amount);
  const minAmount = (amount * 0.95).toFixed(2);
  const maxAmount = (amount * 1.05).toFixed(2);

  const description = input.description.trim();

  const conditions = [
    eq(transactions.userId, userId),
    isNull(transactions.parentTransactionId),
    gte(transactions.transactionDate, startDate),
    lte(transactions.transactionDate, endDate),
    gte(transactions.amount, minAmount),
    lte(transactions.amount, maxAmount),
    ilike(transactions.description, `%${description}%`),
  ];

  if (input.cardId) {
    conditions.push(eq(transactions.cardId, input.cardId));
  }

  return db.query.transactions.findMany({
    where: and(...conditions),
  });
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

  const updateData: any = {
    ...input,
    updatedAt: new Date(),
  };

  // If amount is provided, convert to string and update all installments proportionally
  if (input.amount) {
    const newAmount = Number(input.amount);
    const oldAmount = Number(transaction.amount);
    
    updateData.amount = newAmount.toString();

    // Update all installments proportionally
    const existingInstallments = await db.query.installments.findMany({
      where: eq(installments.transactionId, transactionId),
    });

    if (existingInstallments.length > 0) {
      const newAmountPerInstallment = (newAmount / existingInstallments.length).toFixed(2);
      
      for (const installment of existingInstallments) {
        await db
          .update(installments)
          .set({
            amount: newAmountPerInstallment,
          })
          .where(eq(installments.id, installment.id));
      }
    }
  }

  const updatedResult = await db
    .update(transactions)
    .set(updateData)
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
