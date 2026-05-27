import {pgTable, uuid, integer, numeric, timestamp} from 'drizzle-orm/pg-core';
import {users} from './users';
import {budgets} from './budgets';

export const budgetAlertEvents = pgTable('budget_alert_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  budgetId: uuid('budget_id').notNull().references(() => budgets.id, {onDelete: 'cascade'}),
  userId: uuid('user_id').notNull().references(() => users.id, {onDelete: 'cascade'}),
  threshold: integer('threshold').notNull(),
  totalSpent: numeric('total_spent', {precision: 15, scale: 2}).notNull(),
  limitAmount: numeric('limit_amount', {precision: 15, scale: 2}).notNull(),
  percent: numeric('percent', {precision: 6, scale: 2}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type BudgetAlertEvent = typeof budgetAlertEvents.$inferSelect;
export type NewBudgetAlertEvent = typeof budgetAlertEvents.$inferInsert;