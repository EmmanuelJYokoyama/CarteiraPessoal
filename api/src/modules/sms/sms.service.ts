import {db} from '@db/index';
import {users} from '../../db/schema/users';
import {otpCodes} from '../../db/schema/otpCodes';
import {transactions} from '../../db/schema/transactions';
import {and, eq, isNull} from 'drizzle-orm';
import {parseBankSms, ParsedSmsData} from './sms.parser';

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

  await db
    .delete(otpCodes)
    .where(
      and(
        eq(otpCodes.userId, userId),
        isNull(otpCodes.verifiedAt),
      )
    );

  const code = generateConfirmationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

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

export async function processBankSms(
  userId: string,
  message: string,
  cardId: string
): Promise<ParsedSmsData> {
  const parsedData = parseBankSms(message);

  if (!parsedData.parsed) {
    return parsedData;
  }

  const transactionDate = parsedData.date || new Date();

  await db.insert(transactions).values({
    userId,
    cardId,
    amount: parsedData.amount.toString(),
    description: `SMS: ${parsedData.bank.toUpperCase()} - ${parsedData.establishment || 'Sem estabelecimento'}`,
    category: 'SMS Bancário',
    transactionDate,
    status: 'completed',
  });

  return parsedData;
}

export async function parseAndLogBankMessage(
  userId: string,
  cardId: string,
  smsContent: string
): Promise<{success: boolean; data?: ParsedSmsData; error?: string}> {
  try {
    const result = await processBankSms(userId, smsContent, cardId);

    if (result.parsed) {
      console.log(`✅ SMS bancário processado para usuário ${userId}:`, {
        bank: result.bank,
        amount: result.amount,
        establishment: result.establishment,
      });
    }

    return {success: result.parsed, data: result};
  } catch (error) {
    console.error(`❌ Erro ao processar SMS bancário para ${userId}:`, error);
    return {
      success: false,
      error: (error as Error).message || 'Erro ao processar SMS',
    };
  }
}
