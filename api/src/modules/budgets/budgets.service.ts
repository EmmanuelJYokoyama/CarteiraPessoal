import {db} from '@db/index';
import {budgets} from '@/db/schema/budgets';
import {transactions} from '@/db/schema/transactions';
import {and, eq, gte, lte} from 'drizzle-orm';
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
  return Array.isArray(updated) ? updated[0] : updated;
}

export async function deleteBudget(budgetId: string, userId: string) {
  await db.delete(budgets).where(eq(budgets.id, budgetId));
}

export async function calculateBudgetProgress(budgetId: string, userId: string) {
  const budget = await getBudgetById(budgetId, userId);

  // Build conditions for transactions that count towards the budget
  const conditions: any[] = [ eq(transactions.userId, userId), gte(transactions.transactionDate, budget.periodStart), lte(transactions.transactionDate, budget.periodEnd) ];
  if (budget.category) conditions.push(eq(transactions.category, budget.category));
  if (budget.cardId) conditions.push(eq(transactions.cardId, budget.cardId));

  const txs = await db.query.transactions.findMany({ where: and(...conditions) });

  const totalSpent = txs.reduce((sum, t) => sum + Number(t.amount), 0);
  const limit = Number(budget.amount);
  const percent = limit === 0 ? 0 : Math.min(100, (totalSpent / limit) * 100);

  return {
    budget,
    totalSpent: totalSpent.toFixed(2),
    limit: limit.toFixed(2),
    percent: Number(percent.toFixed(2)),
    remaining: (limit - totalSpent).toFixed(2),
  };
}
