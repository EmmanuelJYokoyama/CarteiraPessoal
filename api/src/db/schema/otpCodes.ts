import {pgTable, uuid, varchar, timestamp} from 'drizzle-orm/pg-core';
import {users} from './users';

export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, {onDelete: 'cascade'}),
  code: varchar('code', {length: 6}).notNull(),
  phoneNumber: varchar('phone_number', {length: 20}).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type OtpCode = typeof otpCodes.$inferSelect;
export type NewOtpCode = typeof otpCodes.$inferInsert;
