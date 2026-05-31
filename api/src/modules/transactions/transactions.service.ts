import {db} from '@db/index';
import {transactions, installments} from '../../db/schema/transactions';
import {eq, and, isNull, gte, lte, desc} from 'drizzle-orm';
import type {CreateTransactionInput, UpdateTransactionInput, PayInstallmentInput, DuplicateCheckInput} from './transactions.schema';
import {checkBudgetAlertCandidatesForUser} from '../budgets/budgetAlerts.service';
import {sendBudgetAlerts} from '../budgets/budgetAlerts.notifications';
import {convertCurrencyToBrl, normalizeCurrencyCode} from '../exchangeRates/exchangeRates.service';

// Helper function to convert database numeric fields to numbers for frontend
function serializeTransaction(tx: any) {
  return {
    ...tx,
    amount: Number(tx.amount),
    originalAmount: tx.originalAmount != null ? Number(tx.originalAmount) : null,
    exchangeRate: tx.exchangeRate != null ? Number(tx.exchangeRate) : null,
    latitude: tx.latitude ? Number(tx.latitude) : null,
    longitude: tx.longitude ? Number(tx.longitude) : null,
  };
}

function serializeInstallment(inst: any) {
  return {
    ...inst,
    amount: Number(inst.amount),
  };
}

export async function createTransaction(userId: string, input: CreateTransactionInput) {
  const transactionDate = input.transactionDate instanceof Date 
    ? input.transactionDate 
    : new Date(input.transactionDate);

  const currency = normalizeCurrencyCode(input.currency);
  const amount = Number(input.amount);
  const money = await resolveMoney(amount, currency);
  const installmentCount = input.installments || 1;
  const amountPerInstallment = (money.amount / installmentCount).toFixed(2);

  const result = await db.transaction(async (tx) => {
    const newTransactionResult = await tx
      .insert(transactions)
      .values({
        userId,
        cardId: input.cardId,
        description: input.description,
        amount: money.amount.toFixed(2),
        originalAmount: money.originalAmount.toFixed(2),
        currency: money.currency,
        exchangeRate: money.exchangeRate.toFixed(6),
        installments: installmentCount,
        installmentsPaid: 0,
        category: input.category,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        location: input.location ?? null,
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
      transaction: serializeTransaction(newTransaction),
      installments: createdInstallments.map(serializeInstallment),
    };
  });

  await notifyBudgetAlerts(userId);
  return result;
}

export async function getTransactionsByUserId(userId: string) {
  return getAllTransactionsByUserId(userId);
}

export async function getPagedTransactionsByUserId(userId: string, skip: number, take: number) {
  const pagedTransactions = await db.query.transactions.findMany({
    where: and(
      eq(transactions.userId, userId),
      isNull(transactions.parentTransactionId)
    ),
    orderBy: [desc(transactions.transactionDate), desc(transactions.createdAt)],
    offset: skip,
    limit: take + 1,
  });

  const hasMore = pagedTransactions.length > take;
  const visibleTransactions = hasMore ? pagedTransactions.slice(0, take) : pagedTransactions;

  const transactionsWithInstallments = await Promise.all(
    visibleTransactions.map(async (tx) => {
      const txInstallments = await db.query.installments.findMany({
        where: eq(installments.transactionId, tx.id),
      });

      return {
        ...serializeTransaction(tx),
        installmentDetails: txInstallments.map(serializeInstallment),
      };
    })
  );

  return {
    items: transactionsWithInstallments,
    pageInfo: {
      skip,
      take,
      hasMore,
    },
  };
}

export async function getAllTransactionsByUserId(userId: string) {
  const userTransactions = await db.query.transactions.findMany({
    where: and(
      eq(transactions.userId, userId),
      isNull(transactions.parentTransactionId)
    ),
    orderBy: [desc(transactions.transactionDate), desc(transactions.createdAt)],
  });

  console.log('[TransactionService] Found transactions:', userTransactions.length);

  const transactionsWithInstallments = await Promise.all(
    userTransactions.map(async (tx) => {
      const txInstallments = await db.query.installments.findMany({
        where: eq(installments.transactionId, tx.id),
      });

      return {
        ...serializeTransaction(tx),
        installmentDetails: txInstallments.map(serializeInstallment),
      };
    })
  );

  return transactionsWithInstallments;
}

export async function findDuplicateTransactions(
  userId: string,
  input: DuplicateCheckInput
) {
  const rawDate = input.transactionDate instanceof Date ? input.transactionDate : new Date(input.transactionDate);
  const targetAmount = await resolveComparableAmount(Number(input.amount), normalizeCurrencyCode(input.currency));
  const normalizedDescription = normalizeText(input.description);

  const startDate = new Date(rawDate);
  startDate.setDate(startDate.getDate() - 3);

  const endDate = new Date(rawDate);
  endDate.setDate(endDate.getDate() + 3);

  const candidateConditions = [
    eq(transactions.userId, userId),
    isNull(transactions.parentTransactionId),
    gte(transactions.transactionDate, startDate),
    lte(transactions.transactionDate, endDate),
  ];

  if (input.cardId) {
    candidateConditions.push(eq(transactions.cardId, input.cardId));
  }

  const candidates = await db.query.transactions.findMany({
    where: and(...candidateConditions),
  });

  return candidates
    .map(candidate => {
      const candidateAmount = Number(candidate.amount);
      const candidateDate = new Date(candidate.transactionDate);
      const amountDifference = Math.abs(candidateAmount - targetAmount);
      const amountTolerance = targetAmount * 0.05;
      const dayDifference = Math.abs(daysBetween(candidateDate, rawDate));
      const merchantMatch = isMerchantMatch(normalizedDescription, normalizeText(candidate.description));

      const matches = amountDifference <= amountTolerance && dayDifference <= 3 && merchantMatch;
      const score = [amountDifference <= amountTolerance, dayDifference <= 3, merchantMatch].filter(Boolean).length;

      return {
        candidate: serializeTransaction(candidate),
        matches,
        score,
        amountDifference,
        dayDifference,
      };
    })
    .filter(item => item.matches)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (left.dayDifference !== right.dayDifference) return left.dayDifference - right.dayDifference;
      return left.amountDifference - right.amountDifference;
    })
    .map(item => item.candidate);
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isMerchantMatch(left: string, right: string) {
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const leftTokens = new Set(left.split(' ').filter(token => token.length > 2));
  const rightTokens = new Set(right.split(' ').filter(token => token.length > 2));

  let common = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      common++;
    }
  }

  const maxSize = Math.max(leftTokens.size, rightTokens.size);
  if (maxSize === 0) return false;

  return common / maxSize >= 0.5;
}

function daysBetween(left: Date, right: Date) {
  const diffMs = left.getTime() - right.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
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
    transaction: serializeTransaction(transaction),
    installments: transactionInstallments.map(serializeInstallment),
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

  if (Object.prototype.hasOwnProperty.call(input, 'latitude')) {
    updateData.latitude = input.latitude ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'longitude')) {
    updateData.longitude = input.longitude ?? null;
  }

  const moneyUpdateNeeded = Boolean(input.amount || input.currency);

  if (moneyUpdateNeeded) {
    const effectiveCurrency = normalizeCurrencyCode(input.currency ?? transaction.currency ?? 'BRL');
    const sourceAmount = Number(input.amount ?? transaction.originalAmount ?? transaction.amount);
    const money = await resolveMoney(sourceAmount, effectiveCurrency);

    updateData.amount = money.amount.toFixed(2);
    updateData.originalAmount = money.originalAmount.toFixed(2);
    updateData.currency = money.currency;
    updateData.exchangeRate = money.exchangeRate.toFixed(6);

    // Update all installments proportionally
    const existingInstallments = await db.query.installments.findMany({
      where: eq(installments.transactionId, transactionId),
    });

    if (existingInstallments.length > 0) {
      const newAmountPerInstallment = (money.amount / existingInstallments.length).toFixed(2);
      
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

  await notifyBudgetAlerts(userId);
  return serializeTransaction(updated);
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

  await notifyBudgetAlerts(userId);
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

  await notifyBudgetAlerts(userId);
  return updated;
}

async function notifyBudgetAlerts(userId: string) {
  try {
    const notifications = await checkBudgetAlertCandidatesForUser(userId);
    if (notifications.length > 0) {
      await sendBudgetAlerts(notifications);
    }
  } catch (error) {
    console.error('[TransactionService] Failed to evaluate budget alerts', error);
  }
}

async function resolveMoney(amount: number, currency: string) {
  if (currency === 'BRL') {
    return {
      amount,
      originalAmount: amount,
      currency,
      exchangeRate: 1,
    };
  }

  const conversion = await convertCurrencyToBrl(amount, currency);
  return {
    amount: conversion.convertedAmount,
    originalAmount: amount,
    currency,
    exchangeRate: conversion.conversionRate,
  };
}

async function resolveComparableAmount(amount: number, currency: string) {
  if (currency === 'BRL') {
    return amount;
  }

  const conversion = await convertCurrencyToBrl(amount, currency);
  return conversion.convertedAmount;
}
