import {db} from '@db/index';
import {users} from '../../db/schema/users';
import {otpCodes} from '../../db/schema/otpCodes';
import {eq, and, isNull, lt} from 'drizzle-orm';
import {sendOtpSms, generateOtpCode} from '@plugins/twilio';

const OTP_EXPIRATION_MINUTES = 10;

/**
 * Inicia o processo de 2FA enviando um código OTP
 */
export async function initiateTwoFactor(userId: string, phoneNumber: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) throw new Error('USER_NOT_FOUND');

  // Revoga códigos anteriores não validados
  await db
    .delete(otpCodes)
    .where(
      and(
        eq(otpCodes.userId, userId),
        isNull(otpCodes.verifiedAt),
      )
    );

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  try {
    await sendOtpSms({phone: phoneNumber, code});
  } catch (err) {
    throw new Error('FAILED_TO_SEND_SMS');
  }

  // Armazena o código no banco
  const [otpRecord] = await db
    .insert(otpCodes)
    .values({
      userId,
      code,
      phoneNumber,
      expiresAt,
    })
    .returning({id: otpCodes.id});

  return {
    otpId: otpRecord.id,
    message: `Código OTP enviado para ${maskPhone(phoneNumber)}`,
  };
}

/**
 * Valida o código OTP fornecido pelo usuário
 */
export async function validateOtp(userId: string, code: string) {
  const otpRecord = await db.query.otpCodes.findFirst({
    where: and(
      eq(otpCodes.userId, userId),
      eq(otpCodes.code, code),
      isNull(otpCodes.verifiedAt),
    ),
  });

  if (!otpRecord) {
    throw new Error('INVALID_OTP');
  }

  if (new Date() > otpRecord.expiresAt) {
    throw new Error('OTP_EXPIRED');
  }

  // Marca o código como validado
  await db
    .update(otpCodes)
    .set({verifiedAt: new Date()})
    .where(eq(otpCodes.id, otpRecord.id));

  return {verified: true, message: 'Código validado com sucesso'};
}

/**
 * Limpa códigos OTP expirados
 */
export async function cleanupExpiredOtpCodes() {
  const now = new Date();
  await db
    .delete(otpCodes)
    .where(
      and(
        lt(otpCodes.expiresAt, now),
        isNull(otpCodes.verifiedAt),
      )
    );
}

/**
 * Máscara um número de telefone para exibição
 */
export function maskPhone(phone: string): string {
  return phone.replace(/(\+?\d{2,3})\d+(\d{4})$/, '$1 ••••• $2');
}
