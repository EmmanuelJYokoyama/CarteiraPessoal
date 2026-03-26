import {db} from '@db/index';
import {users} from '../../db/schema/users';
import {eq} from 'drizzle-orm';
import {hashPin, comparePin} from '@plugins/hash';

export async function setUserPin(userId: string, pin: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) throw new Error('USER_NOT_FOUND');

  const pinHash = await hashPin(pin);

  await db
    .update(users)
    .set({ pinHash })
    .where(eq(users.id, userId));

  return { message: 'PIN configurado com sucesso' };
}

export async function validateUserPin(userId: string, pin: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) throw new Error('USER_NOT_FOUND');
  if (!user.pinHash) throw new Error('PIN_NOT_SET');

  return comparePin(pin, user.pinHash);
}
