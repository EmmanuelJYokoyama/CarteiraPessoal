import {pgTable, uuid, varchar, timestamp} from 'drizzle-orm/pg-core';
import {users} from './users';

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, {onDelete: 'cascade'}),
  name: varchar('name', {length: 100}).notNull(),
  color: varchar('color', {length: 7}).default('#2ED573'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
