import {pgTable, uuid, varchar, numeric, timestamp, integer, index} from 'drizzle-orm/pg-core';
import {sql} from 'drizzle-orm';
import {users} from './users';

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, {onDelete: 'cascade'}),
    cardId: uuid('card_id'),
    parentTransactionId: uuid('parent_transaction_id').references(() => transactions.id, {onDelete: 'cascade'}),
    description: varchar('description', {length: 255}).notNull(),
    amount: numeric('amount', {precision: 15, scale: 2}).notNull(),
    originalAmount: numeric('original_amount', {precision: 15, scale: 2}).notNull(),
    currency: varchar('currency', {length: 3}).notNull().default('BRL'),
    exchangeRate: numeric('exchange_rate', {precision: 15, scale: 6}).notNull().default('1'),
    installments: integer('installments').default(1).notNull(),
    installmentsPaid: integer('installments_paid').default(0).notNull(),
    category: varchar('category', {length: 50}),
    status: varchar('status', {length: 20}).default('pending').notNull(),
    transactionDate: timestamp('transaction_date').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    reportDateIdx: index('transactions_report_user_date_idx').on(table.userId, table.transactionDate).where(sql`${table.parentTransactionId} is null`),
    reportCategoryIdx: index('transactions_report_user_category_idx').on(table.userId, table.category).where(sql`${table.parentTransactionId} is null`),
  }),
);

export const installments = pgTable('installments', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id').notNull().references(() => transactions.id, {onDelete: 'cascade'}),
  installmentNumber: integer('installment_number').notNull(),
  amount: numeric('amount', {precision: 15, scale: 2}).notNull(),
  dueDate: timestamp('due_date').notNull(),
  status: varchar('status', {length: 20}).default('pending').notNull(),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Installment = typeof installments.$inferSelect;
export type NewInstallment = typeof installments.$inferInsert;
