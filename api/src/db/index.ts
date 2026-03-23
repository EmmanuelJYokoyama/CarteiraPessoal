import {drizzle} from 'drizzle-orm/node-postgres';
import {Pool} from 'pg';
import * as dotenv from 'dotenv';
import {users} from './schema/users';
import {userSettings} from './schema/userSettings';

const schema = {users, userSettings};

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, {schema});