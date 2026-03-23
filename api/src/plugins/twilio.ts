import twilio from 'twilio';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`MISSING_ENV_${name}`);
  }
  return value;
}

const accountSid = getRequiredEnv('TWILIO_ACCOUNT_SID');
const authToken = getRequiredEnv('TWILIO_AUTH_TOKEN');
const phoneNumber = getRequiredEnv('TWILIO_PHONE_NUMBER');

const client = twilio(accountSid, authToken);

export interface SendOtpOptions {
  phone: string;
  code: string;
}

export interface VerifyOtpOptions {
  phone: string;
  code: string;
}


export async function sendOtpSms({phone, code}: SendOtpOptions): Promise<{messageSid: string}> {
  try {
    const message = await client.messages.create({
      body: `Seu código de verificação Carteira Pessoal é: ${code}\n\nValidade: 10 minutos`,
      from: phoneNumber,
      to: phone,
    });

    return {messageSid: message.sid};
  } catch (error: any) {
    console.error('Erro ao enviar SMS:', error.message);
    throw new Error(`TWILIO_ERROR_${error.message}`);
  }
}

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
