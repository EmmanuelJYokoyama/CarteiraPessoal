import {apiRequest} from './client';

export type BillingPeriod = {
  startDate: string;
  endDate: string;
  closingDay: number;
  dueDay: number;
};

export type CardBillingStatement = {
  cardId: string;
  cardName: string;
  billingPeriod: BillingPeriod;
  transactions: Array<{
    id: string;
    description: string;
    amount: string;
    category?: string;
    status: string;
    transactionDate: string;
  }>;
  totalAmount: string;
  pendingAmount: string;
  completedAmount: string;
};

export type CategoryBreakdown = {
  category: string;
  total: string;
  count: number;
};

export async function getUserBillingStatements(): Promise<CardBillingStatement[]> {
  return apiRequest('/billing/statements', {
    method: 'GET',
  });
}

export async function getCardBillingStatement(cardId: string): Promise<CardBillingStatement> {
  return apiRequest(`/billing/statements/${cardId}`, {
    method: 'GET',
    cacheTTL: 300000, // Cache por 5 minutos
  });
}

export async function getCardStatementByCategory(cardId: string): Promise<CategoryBreakdown[]> {
  return apiRequest(`/billing/statements/${cardId}/by-category`, {
    method: 'GET',
    cacheTTL: 300000, // Cache por 5 minutos
  });
}
