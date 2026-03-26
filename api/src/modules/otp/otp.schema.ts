import {z} from 'zod';

export const initiateTwoFactorSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Telefone inválido'),
});

export const validateOtpSchema = z.object({
  code: z.string().length(6, 'Código deve ter 6 dígitos'),
});

export type InitiateTwoFactorInput = z.infer<typeof initiateTwoFactorSchema>;
export type ValidateOtpInput = z.infer<typeof validateOtpSchema>;
