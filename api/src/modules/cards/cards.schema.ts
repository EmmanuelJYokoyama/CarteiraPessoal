import { z } from 'zod';

export const createCardSchema = z.object({
  name: z.string().min(1, 'Nome do cartão é obrigatório'),
  cardNumber: z.string().regex(/^\d{13,19}$/, 'Número do cartão inválido').optional(),
  lastFourDigits: z.string().regex(/^\d{4}$/, 'Deve conter exatamente 4 dígitos'),
  cardType: z.enum(['credit', 'debit', 'prepaid']),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, 'Formato deve ser MM/YY'),
  // Accept both formats: 4000, 4000.00, 4,000.00 (Brazilian format with point as thousands separator)
  limit: z.string()
    .transform(val => val.trim())
    .refine(val => val === '' || /^[\d.,]+$/.test(val), 'Limite deve conter apenas números')
    .transform(val => {
      if (val === '') return undefined;
      // Remove dots used as thousands separator and convert comma to dot
      return val.replace(/\./g, '').replace(',', '.');
    })
    .refine(val => val === undefined || /^\d+(\.\d{1,2})?$/.test(val as string), 'Limite deve ser um valor numérico válido')
    .optional(),
});

export const updateCardSchema = createCardSchema.partial();

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
