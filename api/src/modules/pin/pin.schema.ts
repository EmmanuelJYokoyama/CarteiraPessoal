import {z} from 'zod';

export const setPinSchema = z.object({
  pin: z.string().length(4, 'PIN deve ter 4 dígitos').regex(/^\d+$/, 'PIN deve conter apenas números'),
});

export const validatePinSchema = z.object({
  pin: z.string().length(4, 'PIN deve ter 4 dígitos').regex(/^\d+$/, 'PIN deve conter apenas números'),
});

export const loginWithPinSchema = z.object({
  email: z.string().email('Email inválido'),
  pin: z.string().length(4, 'PIN deve ter 4 dígitos').regex(/^\d+$/, 'PIN deve conter apenas números'),
});

export type SetPinInput = z.infer<typeof setPinSchema>;
export type ValidatePinInput = z.infer<typeof validatePinSchema>;
export type LoginWithPinInput = z.infer<typeof loginWithPinSchema>;
