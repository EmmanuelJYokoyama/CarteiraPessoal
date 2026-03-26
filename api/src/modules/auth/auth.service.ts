import {db} from '@db/index';
import {users} from '../../db/schema/users';
import {userSettings} from '../../db/schema/userSettings';
import {refreshTokens} from '../../db/schema/tokens';
import {and, eq, isNull, lt} from 'drizzle-orm';
import { hashPassword, comparePassword } from '@plugins/hash';
import type { RegisterInput, LoginInput } from './auth.schema';
import type { AuthTokenPayload } from './auth.types';
import { FastifyInstance } from 'fastify';

const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutos em segundos
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 dias em segundos

export async function registerUser(input: RegisterInput) {
  const userExists = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (userExists) throw new Error('EMAIL_EXISTS');

  const passwordHash = await hashPassword(input.password);

  const user = await db.transaction(async (tx) => {
    const [createdUser] = await tx
      .insert(users)
      .values({
        name: input.name,
        email: input.email,
        phoneNumber: input.phoneNumber,
        passwordHash,
      })
      .returning({id: users.id, email: users.email, phoneNumber: users.phoneNumber});

    await tx.insert(userSettings).values({
      userId: createdUser.id,
      currency: 'BRL',
      locale: 'pt-BR',
    });

    return createdUser;
  });

  return user;
}

export async function deleteUserById(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
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

export async function generateTokens(app: FastifyInstance, userId: string, email: string) {
  const accessPayload: AuthTokenPayload = { userId, email, type: 'access' };
  const refreshPayload: AuthTokenPayload = { userId, email, type: 'refresh' };

  const accessToken = app.jwt.sign(accessPayload, { expiresIn: `${ACCESS_TOKEN_EXPIRY}s` });
  const refreshToken = app.jwt.sign(refreshPayload, { expiresIn: `${REFRESH_TOKEN_EXPIRY}s` });
  
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000);
  await db.insert(refreshTokens).values({
    userId,
    token: refreshToken,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY,
  };
}

export async function refreshUserTokens(app: FastifyInstance, userId: string, oldRefreshToken: string) {
  const storedToken = await db.query.refreshTokens.findFirst({
    where: and(
      eq(refreshTokens.userId, userId),
      eq(refreshTokens.token, oldRefreshToken),
      isNull(refreshTokens.revokedAt)
    ),
  });

  if (!storedToken) throw new Error('INVALID_REFRESH_TOKEN');

  if (new Date() > storedToken.expiresAt) {
    throw new Error('REFRESH_TOKEN_EXPIRED');
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) throw new Error('USER_NOT_FOUND');

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, storedToken.id));

  return generateTokens(app, userId, user.email);
}

export async function revokeRefreshToken(userId: string, refreshToken: string) {
  const token = await db.query.refreshTokens.findFirst({
    where: and(
      eq(refreshTokens.userId, userId),
      eq(refreshTokens.token, refreshToken),
      isNull(refreshTokens.revokedAt)
    ),
  });

  if (!token) throw new Error('INVALID_TOKEN');

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, token.id));
}

export async function revokeAllUserTokens(userId: string) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(
      eq(refreshTokens.userId, userId),
      isNull(refreshTokens.revokedAt)
    ));
}

export async function cleanupExpiredTokens() {
  const now = new Date();
  await db.delete(refreshTokens).where(
    and(
      lt(refreshTokens.expiresAt, now),
      isNull(refreshTokens.revokedAt)
    )
  );
}