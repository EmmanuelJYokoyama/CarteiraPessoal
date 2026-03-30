import {z} from 'zod';

export const smsConfirmationSchema = z.object({
  email: z.string().email('E-mail inválido'),
  code:  z.string().length(6, 'Código deve ter 6 dígitos'),
});

export const resendSmsSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

export type SmsConfirmationInput = z.infer<typeof smsConfirmationSchema>;
export type ResendSmsInput = z.infer<typeof resendSmsSchema>;
