import {z} from 'zod';

export const suggestCategorySchema = z.object({
  description: z.string().trim().min(1, 'Description is required'),
});

export type SuggestCategoryInput = z.infer<typeof suggestCategorySchema>;
