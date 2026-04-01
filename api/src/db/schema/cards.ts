import {pgTable, uuid, varchar, timestamp} from 'drizzle-orm/pg-core';
import {users} from './users';

export const cards = pgTable('cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: varchar('name', {length: 100}).notNull(),
  lastFourDigits: varchar('last_four_digits', {length: 4}),
  cardType: varchar('card_type', {length: 50}),
  brand: varchar('brand', {length: 50}),
  expiryDate: varchar('expiry_date', {length: 5}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
