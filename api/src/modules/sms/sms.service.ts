import {db} from '@db/index';
import {users} from '../../db/schema/users';
import {otpCodes} from '../../db/schema/otpCodes';
import {and, eq, isNull} from 'drizzle-orm';

export async function confirmUserViaSms(email: string, code: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) throw new Error('USER_NOT_FOUND');

  const otpRecord = await db.query.otpCodes.findFirst({
    where: and(
      eq(otpCodes.userId, user.id),
      eq(otpCodes.code, code),
      isNull(otpCodes.verifiedAt),
    ),
  });

  if (!otpRecord) throw new Error('INVALID_CODE');

  if (new Date() > otpRecord.expiresAt) {
    throw new Error('CODE_EXPIRED');
  }

  await db.transaction(async (tx) => {
    await tx
      .update(otpCodes)
      .set({ verifiedAt: new Date() })
      .where(eq(otpCodes.id, otpRecord.id));

    await tx
      .update(users)
      .set({ isActive: true })
      .where(eq(users.id, user.id));
  });

  return user;
}

export async function initiateSmsSending(userId: string, phoneNumber: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) throw new Error('USER_NOT_FOUND');

  // Remove códigos anteriores não verificados
  await db
    .delete(otpCodes)
    .where(
      and(
        eq(otpCodes.userId, userId),
        isNull(otpCodes.verifiedAt),
      )
    );

  const code = generateConfirmationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

  // Importamos sendOtpSms do Twilio
  const { sendOtpSms } = await import('@plugins/twilio');

  try {
    console.log(`📱 Iniciando envio de SMS para ${phoneNumber} - user: ${userId}`);
    const result = await sendOtpSms({ phone: phoneNumber, code });
    console.log(`✅ SMS enviado com sucesso! MessageSID: ${result.messageSid}`);
  } catch (err: any) {
    console.error(`❌ ERRO ao enviar SMS:`, err.message || err);
    throw new Error('FAILED_TO_SEND_SMS');
  }

  await db.insert(otpCodes).values({
    userId,
    code,
    phoneNumber,
    expiresAt,
  });

  console.log(`✅ Código salvo no banco para userId: ${userId}, código: ${code}`);

  return {
    message: `Código de confirmação enviado para ${maskPhoneNumber(phoneNumber)}`,
  };
}

export function generateConfirmationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function maskPhoneNumber(phone: string): string {
  return phone.replace(/(\+?\d{2,3})\d+(\d{4})$/, '$1 ••••• $2');
}

export async function resendSmsByEmail(email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  if (!user.phoneNumber) {
    throw new Error('PHONE_NOT_FOUND');
  }

  if (user.isActive) {
    throw new Error('ACCOUNT_ALREADY_CONFIRMED');
  }

  return initiateSmsSending(user.id, user.phoneNumber);
}
