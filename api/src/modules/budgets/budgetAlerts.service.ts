import {db} from '@db/index';
import {budgetAlertEvents} from '@db/schema/budgetAlertEvents';
import {budgets} from '@db/schema/budgets';
import {users} from '@db/schema/users';
import {and, eq} from 'drizzle-orm';
import {calculateBudgetProgress} from './budgets.service';

export type BudgetAlertLevel = 80 | 100;

export interface BudgetAlertNotification {
  userId: string;
  budgetId: string;
  budgetName: string;
  limit: number;
  totalSpent: number;
  percent: number;
  level: BudgetAlertLevel;
  isOverBudget: boolean;
}

async function hasAlertBeenSent(budgetId: string, threshold: BudgetAlertLevel) {
  const existing = await db
    .select({id: budgetAlertEvents.id})
    .from(budgetAlertEvents)
    .where(and(eq(budgetAlertEvents.budgetId, budgetId), eq(budgetAlertEvents.threshold, threshold)));

  return existing.length > 0;
}

async function recordAlert(notification: BudgetAlertNotification) {
  await db.insert(budgetAlertEvents).values({
    budgetId: notification.budgetId,
    userId: notification.userId,
    threshold: notification.level,
    totalSpent: notification.totalSpent.toFixed(2),
    limitAmount: notification.limit.toFixed(2),
    percent: notification.percent.toFixed(2),
  });
}

export async function clearBudgetAlertEventsForBudget(budgetId: string, userId: string) {
  await db
    .delete(budgetAlertEvents)
    .where(and(eq(budgetAlertEvents.budgetId, budgetId), eq(budgetAlertEvents.userId, userId)));
}

export async function checkBudgetAlertCandidatesForUser(userId: string): Promise<BudgetAlertNotification[]> {
  const userBudgets = await db
    .select()
    .from(budgets)
    .where(eq(budgets.userId, userId));

  const notifications: BudgetAlertNotification[] = [];

  for (const budget of userBudgets) {
    const progress = await calculateBudgetProgress(budget.id, userId);
    const limit = Number(progress.limit);
    const totalSpent = Number(progress.totalSpent);
    const percent = progress.rawPercent;

    if (limit <= 0) {
      continue;
    }

    if (percent >= 100) {
      const alreadySent = await hasAlertBeenSent(budget.id, 100);
      if (!alreadySent) {
        notifications.push({
          userId,
          budgetId: budget.id,
          budgetName: budget.name,
          limit,
          totalSpent,
          percent,
          level: 100,
          isOverBudget: progress.isOverBudget,
        });
      }
      continue;
    }

    if (percent >= 80) {
      const alreadySent = await hasAlertBeenSent(budget.id, 80);
      if (!alreadySent) {
        notifications.push({
          userId,
          budgetId: budget.id,
          budgetName: budget.name,
          limit,
          totalSpent,
          percent,
          level: 80,
          isOverBudget: progress.isOverBudget,
        });
      }
    }
  }

  return notifications;
}

export async function registerBudgetAlert(notification: BudgetAlertNotification) {
  await recordAlert(notification);
}

export async function getUserPhoneNumber(userId: string): Promise<string | null> {
  const result = await db
    .select({phoneNumber: users.phoneNumber})
    .from(users)
    .where(eq(users.id, userId));

  if (!result.length) {
    return null;
  }

  return result[0].phoneNumber || null;
}