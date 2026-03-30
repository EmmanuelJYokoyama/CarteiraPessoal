import {z} from 'zod';

export const createTransactionSchema = z.object({
  cardId: z.string().uuid().optional(),
  description: z.string().min(1, 'Descrição obrigatória').max(255),
  amount: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Valor deve ser maior que zero'),
  installments: z.number().int().min(1, 'Mínimo 1 parcela').default(1),
  category: z.string().max(50).optional(),
  transactionDate: z.string().datetime().or(z.date()),
});

export const updateTransactionSchema = z.object({
  description: z.string().min(1).max(255).optional(),
  category: z.string().max(50).optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
});

export const payInstallmentSchema = z.object({
  installmentId: z.string().uuid(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type PayInstallmentInput = z.infer<typeof payInstallmentSchema>;
