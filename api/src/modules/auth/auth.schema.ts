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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput    = z.infer<typeof loginSchema>;