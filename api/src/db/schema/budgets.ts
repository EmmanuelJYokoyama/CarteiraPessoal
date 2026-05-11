import {pgTable, uuid, varchar, numeric, timestamp} from 'drizzle-orm/pg-core';
import {users} from './users';

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, {onDelete: 'cascade'}),
  name: varchar('name', {length: 128}).notNull(),
  amount: numeric('amount', {precision: 15, scale: 2}).notNull(),
  category: varchar('category', {length: 50}).default(null),
  cardId: uuid('card_id').default(null),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
