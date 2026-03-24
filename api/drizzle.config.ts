import {defineConfig} from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema:      './src/db/schema',
  out:         './drizzle/migrations',
  driver:      'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
});