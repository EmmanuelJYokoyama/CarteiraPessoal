import {pgTable, uuid, varchar, timestamp} from 'drizzle-orm/pg-core';
import {users} from './users';

export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, {onDelete: 'cascade', onUpdate: 'cascade'}),
  currency: varchar('currency', {length: 3}).notNull().default('BRL'),
  locale: varchar('locale', {length: 10}).notNull().default('pt-BR'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
