import {z} from 'zod';

export const createBudgetSchema = z.object({
  name: z.string().min(1).max(128),
  amount: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Valor deve ser maior que zero'),
  category: z.string().max(50).nullable().optional(),
  cardId: z.string().uuid().nullable().optional(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

export const updateBudgetSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  amount: z.string().optional().refine(val => !val || (!isNaN(Number(val)) && Number(val) > 0), 'Valor deve ser maior que zero'),
  category: z.string().max(50).nullable().optional(),
  cardId: z.string().uuid().nullable().optional(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
