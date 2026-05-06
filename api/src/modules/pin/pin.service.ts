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

export async function validateUserPinByEmail(email: string, pin: string): Promise<any> {
  console.log('[PIN Service] Looking up user by email:', email);
  
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    console.log('[PIN Service] User lookup result:', user ? `Found user ${user.id}` : 'User not found');

    if (!user) throw new Error('USER_NOT_FOUND');
    if (!user.pinHash) throw new Error('PIN_NOT_SET');

    console.log('[PIN Service] Comparing PIN for user:', user.id);
    const isValid = await comparePin(pin, user.pinHash);
    
    if (!isValid) {
      console.log('[PIN Service] PIN validation failed for user:', user.id);
      throw new Error('PIN_INVALID');
    }

    console.log('[PIN Service] PIN validation successful for user:', user.id);

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    console.error('[PIN Service] Error in validateUserPinByEmail:', error);
    throw error;
  }
}
