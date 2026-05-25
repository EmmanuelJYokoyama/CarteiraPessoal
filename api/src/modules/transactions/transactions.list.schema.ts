import {z} from 'zod';

export const listTransactionsQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(20).default(20),
});

export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;

export type PagedTransactionsResponse = {
  items: unknown[];
  pageInfo: {
    skip: number;
    take: number;
    hasMore: boolean;
  };
};
