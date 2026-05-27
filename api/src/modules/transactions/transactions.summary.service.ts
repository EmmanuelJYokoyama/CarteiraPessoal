import {and, eq, gte, isNull, lte, sql} from 'drizzle-orm';
import {db} from '@db/index';
import {transactions} from '../../db/schema/transactions';
import type {SummaryBucket, TimeOfDaySummaryBucket, TransactionSummaryQuery, TransactionsSummaryResponse} from './transactions.summary.schema';

const DEFAULT_LOOKBACK_DAYS = 30;
const UNCATEGORIZED_LABEL = 'Uncategorized';

type AggregationRow = {
  label: string;
  transactionCount: string | number;
  totalAmount: string | number;
};

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

function toSummaryBucket(row: AggregationRow): SummaryBucket {
  return {
    label: row.label,
    transactionCount: toNumber(row.transactionCount),
    totalAmount: toNumber(row.totalAmount),
  };
}

function buildDefaultRange() {
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - DEFAULT_LOOKBACK_DAYS);

  return {periodStart, periodEnd};
}

function normalizeRange(query: TransactionSummaryQuery) {
  const defaultRange = buildDefaultRange();

  const periodStart = query.periodStart ? new Date(query.periodStart) : defaultRange.periodStart;
  const periodEnd = query.periodEnd ? new Date(query.periodEnd) : defaultRange.periodEnd;

  if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
    throw new Error('INVALID_PERIOD_RANGE');
  }

  if (periodStart > periodEnd) {
    throw new Error('INVALID_PERIOD_RANGE');
  }

  return {periodStart, periodEnd};
}

function buildBaseWhereClause(userId: string, periodStart: Date, periodEnd: Date) {
  return and(
    eq(transactions.userId, userId),
    isNull(transactions.parentTransactionId),
    gte(transactions.transactionDate, periodStart),
    lte(transactions.transactionDate, periodEnd),
  );
}

export async function getTransactionSummary(
  userId: string,
  query: TransactionSummaryQuery,
): Promise<TransactionsSummaryResponse> {
  const {periodStart, periodEnd} = normalizeRange(query);
  const baseWhere = buildBaseWhereClause(userId, periodStart, periodEnd);

  const categoryLabel = sql<string>`coalesce(${transactions.category}, ${UNCATEGORIZED_LABEL})`;
  const monthLabel = sql<string>`to_char(date_trunc('month', ${transactions.transactionDate}), 'YYYY-MM')`;
  const timeOfDayLabel = sql<'morning' | 'afternoon' | 'night'>`
    case
      when extract(hour from ${transactions.transactionDate}) between 6 and 11 then 'morning'
      when extract(hour from ${transactions.transactionDate}) between 12 and 17 then 'afternoon'
      else 'night'
    end
  `;

  const [totalsRows, categoryRows, monthRows, timeOfDayRows] = await Promise.all([
    db.select({
      transactionCount: sql<string>`count(*)`,
      totalAmount: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
    }).from(transactions).where(baseWhere),
    db.select({
      label: categoryLabel,
      transactionCount: sql<string>`count(*)`,
      totalAmount: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
    }).from(transactions).where(baseWhere).groupBy(categoryLabel),
    db.select({
      label: monthLabel,
      transactionCount: sql<string>`count(*)`,
      totalAmount: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
    }).from(transactions).where(baseWhere).groupBy(monthLabel),
    db.select({
      period: timeOfDayLabel,
      label: timeOfDayLabel,
      transactionCount: sql<string>`count(*)`,
      totalAmount: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
    }).from(transactions).where(baseWhere).groupBy(timeOfDayLabel),
  ]);

  const totalsRow = totalsRows[0] ?? {transactionCount: '0', totalAmount: '0'};
  const transactionCount = toNumber(totalsRow.transactionCount);
  const totalAmount = toNumber(totalsRow.totalAmount);

  const byTimeOfDay: TimeOfDaySummaryBucket[] = timeOfDayRows
    .map((row): TimeOfDaySummaryBucket => ({
      period: row.period,
      label: row.label,
      transactionCount: toNumber(row.transactionCount),
      totalAmount: toNumber(row.totalAmount),
    }))
    .sort((left, right) => {
      const order = {morning: 0, afternoon: 1, night: 2} as const;
      return order[left.period] - order[right.period];
    });

  return {
    range: {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    },
    totals: {
      transactionCount,
      totalAmount,
      averageAmount: transactionCount === 0 ? 0 : Number((totalAmount / transactionCount).toFixed(2)),
    },
    byCategory: categoryRows.map(toSummaryBucket).sort((left, right) => right.totalAmount - left.totalAmount),
    byMonth: monthRows.map(toSummaryBucket).sort((left, right) => left.label.localeCompare(right.label)),
    byTimeOfDay,
  };
}