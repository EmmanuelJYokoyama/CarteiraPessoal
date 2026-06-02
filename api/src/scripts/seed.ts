import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import {db} from '@db/index';
import {users} from '@db/schema/users';
import {userSettings} from '@db/schema/userSettings';
import {cards} from '@db/schema/cards';
import {budgets} from '@db/schema/budgets';
import {transactions} from '@db/schema/transactions';
import {refreshTokens} from '@db/schema/tokens';
import {otpCodes} from '@db/schema/otpCodes';
import {eq} from 'drizzle-orm';

dotenv.config();

const demoUserId = process.env.SEED_USER_ID || '08887af1-fe56-4b08-8751-38c8a02be120';
const demoEmail = process.env.SEED_USER_EMAIL || 'demo@carteirapessoal.local';
const demoPassword = process.env.SEED_USER_PASSWORD || '123456';
const demoName = process.env.SEED_USER_NAME || 'Usuário Demo';

async function main() {
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  await db.delete(refreshTokens).where(eq(refreshTokens.userId, demoUserId));
  await db.delete(otpCodes).where(eq(otpCodes.userId, demoUserId));
  await db.delete(transactions).where(eq(transactions.userId, demoUserId));
  await db.delete(budgets).where(eq(budgets.userId, demoUserId));
  await db.delete(cards).where(eq(cards.userId, demoUserId));

  await db.insert(users).values({
    id: demoUserId,
    name: demoName,
    email: demoEmail,
    phoneNumber: process.env.SEED_USER_PHONE || null,
    passwordHash,
    pinHash: null,
    isActive: true,
  }).onConflictDoUpdate({
    target: users.id,
    set: {
      name: demoName,
      email: demoEmail,
      phoneNumber: process.env.SEED_USER_PHONE || null,
      passwordHash,
      isActive: true,
    },
  });

  await db.insert(userSettings).values({
    userId: demoUserId,
    currency: 'BRL',
    locale: 'pt-BR',
  }).onConflictDoUpdate({
    target: userSettings.userId,
    set: {
      currency: 'BRL',
      locale: 'pt-BR',
    },
  });

  console.log('Seed concluído com sucesso para o usuário demo:', demoUserId);
}

main().catch(error => {
  console.error('Erro ao executar seed:', error);
  process.exit(1);
});
