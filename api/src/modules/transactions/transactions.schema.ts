import {z} from 'zod';

export const createTransactionSchema = z.object({
  cardId: z.string().uuid().optional(),
  description: z.string().min(1, 'Descrição obrigatória').max(255),
  amount: z.string()
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Valor deve ser maior que zero')
    .transform(val => {
      // Normalize the amount value
      let normalized = val.trim();
      
      // If contains both . and ,, it's likely Brazilian format (1.500,00)
      if (normalized.includes('.') && normalized.includes(',')) {
        normalized = normalized.replace(/\./g, '').replace(',', '.');
      } 
      // If only comma, it's likely decimal separator (150,50)
      else if (normalized.includes(',') && !normalized.includes('.')) {
        normalized = normalized.replace(',', '.');
      }
      
      const parsed = Number(normalized);
      // Return as string with up to 2 decimal places
      return parsed.toFixed(2);
    }),
  installments: z.number().int().min(1, 'Mínimo 1 parcela').default(1),
  category: z.string().max(50).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  transactionDate: z.string().datetime().or(z.date()),
});

export const updateTransactionSchema = z.object({
  description: z.string().min(1).max(255).optional(),
  amount: z.string()
    .optional()
    .refine(val => !val || (!isNaN(Number(val)) && Number(val) > 0), 'Valor deve ser maior que zero')
    .transform(val => {
      if (!val) return undefined;
      // Normalize the amount value
      // Handle formats: 150, 150.5, 150,50, 1.500,00, 1,500.00
      let normalized = val.trim();
      
      // If contains both . and ,, it's likely Brazilian format (1.500,00)
      if (normalized.includes('.') && normalized.includes(',')) {
        // Brazilian format: remove dots (thousands), replace comma with dot
        normalized = normalized.replace(/\./g, '').replace(',', '.');
      } 
      // If only comma, it's likely decimal separator (150,50)
      else if (normalized.includes(',') && !normalized.includes('.')) {
        normalized = normalized.replace(',', '.');
      }
      
      const parsed = Number(normalized);
      // Return as string with up to 2 decimal places
      return parsed.toFixed(2);
    }),
  category: z.string().max(50).optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const payInstallmentSchema = z.object({
  installmentId: z.string().uuid(),
});

export const duplicateCheckSchema = z.object({
  description: z.string().min(1, 'Descrição obrigatória').max(255),
  amount: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Valor deve ser maior que zero'),
  transactionDate: z.string().datetime().or(z.date()),
  cardId: z.string().uuid().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type PayInstallmentInput = z.infer<typeof payInstallmentSchema>;
export type DuplicateCheckInput = z.infer<typeof duplicateCheckSchema>;
