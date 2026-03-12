import {db} from '@db/index';
import {users} from '../../db/schema/users';
import {eq} from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { hashPassword, comparePassword } from '@plugins/hash';
import type {RegisterInput, LoginInput} from './auth.schema';

export async function registerUser(input: RegisterInput) {
    const userExists = await db.query.users.findFirst({
        where: eq(users.email, input.email),
    });

    if (userExists) throw new Error('EMAIL_EXISTS');
    const passwordHash = await hashPassword(input.password);
    const confirmToken = randomUUID();

    const [user] = await db
        .insert(users)
        .values({name: input.name, email: input.email, passwordHash, confirmToken,})
        .returning({id: users.id, email: users.email});
    return {user, confirmToken};
}

export async function loginUser(data: LoginInput) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (!user) throw new Error('INVALID_CREDENTIALS');
  if (!user.isActive) throw new Error('ACCOUNT_NOT_CONFIRMED');

  const valid = await comparePassword(data.password, user.passwordHash);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  return user;
}

export async function confirmUser(token: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.confirmToken, token),
  });

  if (!user) throw new Error('INVALID_TOKEN');

  await db
    .update(users)
    .set({isActive: true, confirmToken: null})
    .where(eq(users.id, user.id));
}