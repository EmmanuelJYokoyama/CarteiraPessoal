import {z} from 'zod';

const currencyCodeSchema = z.string().trim().regex(/^[A-Za-z]{3}$/, 'Moeda inválida');

const amountStringSchema = z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Valor deve ser maior que zero').transform(val => {
  let normalized = val.trim();

  if (normalized.includes('.') && normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (normalized.includes(',') && !normalized.includes('.')) {
    normalized = normalized.replace(',', '.');
  }

  const parsed = Number(normalized);
  return parsed.toFixed(2);
});

export const createTransactionSchema = z.object({
  cardId: z.string().uuid().optional(),
  description: z.string().min(1, 'Descrição obrigatória').max(255),
  amount: amountStringSchema,
  currency: currencyCodeSchema.optional(),
  installments: z.number().int().min(1, 'Mínimo 1 parcela').default(1),
  category: z.string().max(50).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  location: z.string().max(255).optional(),
  transactionDate: z.string().datetime().or(z.date()),
});

export const updateTransactionSchema = z.object({
  description: z.string().min(1).max(255).optional(),
  amount: amountStringSchema.optional(),
  currency: currencyCodeSchema.optional(),
  category: z.string().max(50).optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  location: z.string().max(255).optional(),
});

export const payInstallmentSchema = z.object({
  installmentId: z.string().uuid(),
});

export const duplicateCheckSchema = z.object({
  description: z.string().min(1, 'Descrição obrigatória').max(255),
  amount: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Valor deve ser maior que zero'),
  currency: currencyCodeSchema.optional(),
  transactionDate: z.string().datetime().or(z.date()),
  cardId: z.string().uuid().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type PayInstallmentInput = z.infer<typeof payInstallmentSchema>;
export type DuplicateCheckInput = z.infer<typeof duplicateCheckSchema>;
