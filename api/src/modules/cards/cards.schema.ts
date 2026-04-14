import { z } from 'zod';

export const createCardSchema = z.object({
  name: z.string().min(1, 'Nome do cartão é obrigatório'),
  cardNumber: z.string().regex(/^\d{13,19}$/, 'Número do cartão inválido').optional(),
  lastFourDigits: z.string().regex(/^\d{4}$/, 'Deve conter exatamente 4 dígitos'),
  cardType: z.enum(['credit', 'debit', 'prepaid']),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, 'Formato deve ser MM/YY'),
  limit: z.string().regex(/^\d+(\.\d{2})?$/, 'Limite deve ser um valor numérico válido').optional(),
});

export const updateCardSchema = createCardSchema.partial();

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
