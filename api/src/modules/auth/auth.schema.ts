import {z} from 'zod';

export const registerSchema = z.object({
  name:     z.string().min(2,  'Nome muito curto'),
  email:    z.string().email(  'E-mail inválido'),
  password: z.string().min(6,  'Senha mínima 6 caracteres'),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export const initiateTwoFactorSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Telefone inválido'),
});

export const validateOtpSchema = z.object({
  code: z.string().length(6, 'Código deve ter 6 dígitos'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput    = z.infer<typeof loginSchema>;
export type RefreshInput  = z.infer<typeof refreshSchema>;
export type InitiateTwoFactorInput = z.infer<typeof initiateTwoFactorSchema>;
export type ValidateOtpInput = z.infer<typeof validateOtpSchema>;