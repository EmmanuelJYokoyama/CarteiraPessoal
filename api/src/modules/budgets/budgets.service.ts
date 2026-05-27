import {db} from '@db/index';
import {budgets} from '@/db/schema/budgets';
import {budgetAlertEvents} from '@/db/schema/budgetAlertEvents';
import {transactions, installments} from '@/db/schema/transactions';
import {and, eq, gte, lte, sql} from 'drizzle-orm';
import type {CreateBudgetInput, UpdateBudgetInput} from './budgets.schema';

export async function createBudget(userId: string, input: CreateBudgetInput) {
  const periodStart = new Date(input.periodStart);
  const periodEnd = new Date(input.periodEnd);
  const result = await db.insert(budgets).values({
    userId,
    name: input.name,
    amount: Number(input.amount).toFixed(2),
    category: input.category || null,
    cardId: input.cardId || null,
    periodStart,
    periodEnd,
  }).returning();

  return Array.isArray(result) ? result[0] : result;
}

export async function getBudgetsByUserId(userId: string) {
  return db.query.budgets.findMany({ where: eq(budgets.userId, userId) });
}

export async function getBudgetById(budgetId: string, userId: string) {
  const b = await db.query.budgets.findFirst({ where: and(eq(budgets.id, budgetId), eq(budgets.userId, userId)) });
  if (!b) throw new Error('BUDGET_NOT_FOUND');
  return b;
}

export async function updateBudget(budgetId: string, userId: string, input: UpdateBudgetInput) {
  const updateData: any = { updatedAt: new Date() };
  if (input.name) updateData.name = input.name;
  if (input.amount) updateData.amount = Number(input.amount).toFixed(2);
  if (Object.prototype.hasOwnProperty.call(input, 'category')) updateData.category = input.category ?? null;
  if (Object.prototype.hasOwnProperty.call(input, 'cardId')) updateData.cardId = input.cardId ?? null;
  if (input.periodStart) updateData.periodStart = new Date(input.periodStart);
  if (input.periodEnd) updateData.periodEnd = new Date(input.periodEnd);

  const updated = await db.update(budgets).set(updateData).where(eq(budgets.id, budgetId)).returning();

  const shouldResetAlerts = ['amount', 'category', 'cardId', 'periodStart', 'periodEnd'].some(key =>
    Object.prototype.hasOwnProperty.call(input, key)
  );

  if (shouldResetAlerts) {
    await db
      .delete(budgetAlertEvents)
      .where(and(eq(budgetAlertEvents.budgetId, budgetId), eq(budgetAlertEvents.userId, userId)));
  }

  return Array.isArray(updated) ? updated[0] : updated;
}

export async function deleteBudget(budgetId: string, userId: string) {
  await db
    .delete(budgetAlertEvents)
    .where(and(eq(budgetAlertEvents.budgetId, budgetId), eq(budgetAlertEvents.userId, userId)));
  await db.delete(budgets).where(eq(budgets.id, budgetId));
}

export async function calculateBudgetProgress(budgetId: string, userId: string) {
  const budget = await getBudgetById(budgetId, userId);

  let totalSpent = 0;

  // Case 1: Budget with category - sum transactions matching category within period
  if (budget.category) {
    // Get all transactions for the user within the budget period
    const userTransactions = await db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, userId),
        gte(transactions.transactionDate, budget.periodStart),
        lte(transactions.transactionDate, budget.periodEnd)
      ),
    });

    // Filter by category (case-insensitive)
    const matchingTransactions = userTransactions.filter(tx => 
      tx.category && tx.category.toLowerCase() === budget.category.toLowerCase()
    );

    // For each matching transaction
    for (const tx of matchingTransactions) {
      if (tx.installments === 1) {
        // Single payment - add full amount
        totalSpent += Number(tx.amount);
      } else {
        // Installment transaction - sum pending installments due in budget period
        const txInstallments = await db.query.installments.findMany({
          where: and(
            eq(installments.transactionId, tx.id),
            gte(installments.dueDate, budget.periodStart),
            lte(installments.dueDate, budget.periodEnd)
          ),
        });
        for (const inst of txInstallments) {
          totalSpent += Number(inst.amount);
        }
      }
    }
  } else if (budget.cardId) {
    // Case 2: Budget with card - sum all transactions for that card within period
    const txs = await db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, userId),
        eq(transactions.cardId, budget.cardId),
        gte(transactions.transactionDate, budget.periodStart),
        lte(transactions.transactionDate, budget.periodEnd)
      ),
    });

    for (const tx of txs) {
      if (tx.installments === 1) {
        totalSpent += Number(tx.amount);
      } else {
        const txInstallments = await db.query.installments.findMany({
          where: and(
            eq(installments.transactionId, tx.id),
            gte(installments.dueDate, budget.periodStart),
            lte(installments.dueDate, budget.periodEnd)
          ),
        });
        for (const inst of txInstallments) {
          totalSpent += Number(inst.amount);
        }
      }
    }
  } else {
    // Case 3: Budget with no category or card - sum all transactions within period
    const txs = await db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, userId),
        gte(transactions.transactionDate, budget.periodStart),
        lte(transactions.transactionDate, budget.periodEnd)
      ),
    });

    for (const tx of txs) {
      if (tx.installments === 1) {
        totalSpent += Number(tx.amount);
      } else {
        const txInstallments = await db.query.installments.findMany({
          where: and(
            eq(installments.transactionId, tx.id),
            gte(installments.dueDate, budget.periodStart),
            lte(installments.dueDate, budget.periodEnd)
          ),
        });
        for (const inst of txInstallments) {
          totalSpent += Number(inst.amount);
        }
      }
    }
  }

  const limit = Number(budget.amount);
  const rawPercent = limit === 0 ? 0 : (totalSpent / limit) * 100;
  const percent = Math.min(100, rawPercent);

  return {
    budget,
    totalSpent: totalSpent.toFixed(2),
    limit: limit.toFixed(2),
    percent: Number(percent.toFixed(2)),
    rawPercent: Number(rawPercent.toFixed(2)),
    isOverBudget: rawPercent > 100,
    remaining: (limit - totalSpent).toFixed(2),
  };
}
