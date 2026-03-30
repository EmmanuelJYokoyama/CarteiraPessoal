import {pgTable, uuid, varchar, boolean, timestamp} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  name:         varchar('name',          {length: 100}).notNull(),
  email:        varchar('email',         {length: 255}).notNull().unique(),
  phoneNumber:  varchar('phone_number',  {length: 20}),
  passwordHash: varchar('password_hash', {length: 255}).notNull(),
  pinHash:      varchar('pin_hash',      {length: 255}),
  isActive:     boolean('is_active').default(false).notNull(),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
});

export type User        = typeof users.$inferSelect;
export type NewUser     = typeof users.$inferInsert;