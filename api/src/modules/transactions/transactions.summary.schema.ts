import {z} from 'zod';

export const transactionSummaryQuerySchema = z.object({
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
});

export type TransactionSummaryQuery = z.infer<typeof transactionSummaryQuerySchema>;

export type SummaryBucket = {
  label: string;
  transactionCount: number;
  totalAmount: number;
};

export type TimeOfDaySummaryBucket = SummaryBucket & {
  period: 'morning' | 'afternoon' | 'night';
};

export type TransactionsSummaryResponse = {
  range: {
    periodStart: string;
    periodEnd: string;
  };
  totals: {
    transactionCount: number;
    totalAmount: number;
    averageAmount: number;
  };
  byCategory: SummaryBucket[];
  byMonth: SummaryBucket[];
  byTimeOfDay: TimeOfDaySummaryBucket[];
};