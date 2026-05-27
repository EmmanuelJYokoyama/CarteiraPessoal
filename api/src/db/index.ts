import {drizzle} from 'drizzle-orm/node-postgres';
import {Pool} from 'pg';
import * as dotenv from 'dotenv';
import {users} from './schema/users';
import {userSettings} from './schema/userSettings';
import {refreshTokens} from './schema/tokens';
import {otpCodes} from './schema/otpCodes';
import {transactions, installments} from './schema/transactions';
import {categories} from './schema/categories';
import {budgets} from './schema/budgets';
import {budgetAlertEvents} from './schema/budgetAlertEvents';

const schema = {users, userSettings, refreshTokens, otpCodes, transactions, installments, categories, budgets, budgetAlertEvents};

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, {schema});