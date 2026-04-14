import {z} from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(100, 'Máximo 100 caracteres'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve ser em formato hexadecimal (ex: #2ED573)').default('#2ED573').optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
