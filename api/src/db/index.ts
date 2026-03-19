import {drizzle} from 'drizzle-orm/node-postgres';
import {Pool} from 'pg';
import * as dotenv from 'dotenv';
import * as usersSchema from './schema/users';
import * as tokensSchema from './schema/tokens';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, {schema: {...usersSchema, ...tokensSchema}});