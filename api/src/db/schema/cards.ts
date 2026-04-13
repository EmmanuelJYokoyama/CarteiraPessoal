import {pgTable, uuid, varchar, timestamp, integer} from 'drizzle-orm/pg-core';
import {users} from './users';

export const cards = pgTable('cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: varchar('name', {length: 100}).notNull(),
  lastFourDigits: varchar('last_four_digits', {length: 4}),
  cardType: varchar('card_type', {length: 50}),
  brand: varchar('brand', {length: 50}),
  expiryDate: varchar('expiry_date', {length: 5}),
  closingDay: integer('closing_day').default(15), // Dia do fechamento (ex: 15)
  dueDay: integer('due_day').default(25), // Dia do vencimento (ex: 25)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
