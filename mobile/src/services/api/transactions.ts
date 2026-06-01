import {apiRequest} from './client';
import {clearCache, invalidateCache} from '@services/cache';
import {logTransactionEvent} from '@services/telemetry/firebaseTelemetry';

export type CreateTransactionPayload = {
  cardId?: string;
  description: string;
  amount: string;
  currency?: string;
  installments?: number;
  category?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
  transactionDate: string;
  status?: 'pending' | 'completed' | 'cancelled';
};

export type DuplicateCheckPayload = {
  description: string;
  amount: string;
  currency?: string;
  transactionDate: string;
  cardId?: string;
};

export type Transaction = {
  id: string;
  userId: string;
  cardId?: string;
  description: string;
  amount: number;
  originalAmount?: number | null;
  currency?: string;
  exchangeRate?: number | null;
  installments: number;
  installmentsPaid: number;
  category?: string;
  latitude?: number | null;
  longitude?: number | null;
  location?: string | null;
  status: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  installmentDetails?: Installment[];
};

export type CategorySuggestion = {
  name: string;
  color: string;
  score: number;
};

export type SuggestCategoryResponse = {
  success: boolean;
  suggestions: CategorySuggestion[];
  topSuggestion: CategorySuggestion | null;
};

export type Installment = {
  id: string;
  transactionId: string;
  installmentNumber: number;
  amount: string;
  dueDate: string;
  status: string;
  paidAt?: string;
  createdAt: string;
};

export type CreateTransactionResponse = {
  transaction: Transaction;
  installments: Installment[];
};

export type ListTransactionsResponse = Transaction[];

export type PagedTransactionsResponse = {
  items: Transaction[];
  pageInfo: {
    skip: number;
    take: number;
    hasMore: boolean;
  };
};

export type DuplicateCheckResponse = {
  count: number;
  duplicates: Transaction[];
};

export async function createTransaction(payload: CreateTransactionPayload) {
  try {
    const response = await apiRequest<CreateTransactionResponse>('/transactions', {
      method: 'POST',
      body: payload,
    });

    // Invalidate cached transaction list pages so UI can refetch fresh data
    await invalidateCache('GET:/transactions');
    void logTransactionEvent('create', 'success', {
      has_category: Boolean(payload.category),
      has_location: Boolean(payload.location),
      has_currency: Boolean(payload.currency && payload.currency !== 'BRL'),
      installment_count: payload.installments ?? 1,
    });

    return response;
  } catch (error) {
    void logTransactionEvent('create', 'failure', {
      has_category: Boolean(payload.category),
      has_location: Boolean(payload.location),
      has_currency: Boolean(payload.currency && payload.currency !== 'BRL'),
      error_message: error instanceof Error ? error.message.slice(0, 80) : 'unknown',
    });
    throw error;
  }
}

export async function suggestCategory(description: string) {
  return apiRequest<SuggestCategoryResponse>('/transactions/suggest-category', {
    method: 'POST',
    body: {description},
  });
}

export async function checkDuplicateTransactions(payload: DuplicateCheckPayload) {
  return apiRequest<DuplicateCheckResponse>('/transactions/check-duplicates', {
    method: 'POST',
    body: payload,
  });
}

export async function listTransactions(skip = 0, take = 20) {
  return apiRequest<PagedTransactionsResponse>(`/transactions?skip=${skip}&take=${take}`, {
    method: 'GET',
    cacheTTL: 300000,
  });
}

export async function listAllTransactions() {
  const allTransactions: Transaction[] = [];
  let skip = 0;
  const take = 20;

  while (true) {
    const response = await listTransactions(skip, take);
    allTransactions.push(...response.items);

    if (!response.pageInfo.hasMore) {
      break;
    }

    skip += take;
  }

  return allTransactions;
}

export async function getTransaction(transactionId: string) {
  return apiRequest<{transaction: Transaction; installments: Installment[]}>(
    `/transactions/${transactionId}`,
    {
      method: 'GET',
    }
  );
}

export async function updateTransaction(
  transactionId: string,
  payload: Partial<CreateTransactionPayload>
) {
  const response = await apiRequest<{transaction: Transaction}>(`/transactions/${transactionId}`, {
    method: 'PUT',
    body: payload,
  });

  await invalidateCache('GET:/transactions');

  return response;
}

export async function deleteTransaction(transactionId: string) {
  const response = await apiRequest<{message: string}>(`/transactions/${transactionId}`, {
    method: 'DELETE',
  });

  await invalidateCache('GET:/transactions');

  return response;
}

export async function payInstallment(installmentId: string) {
  return apiRequest<{message: string}>('/installments/pay', {
    method: 'POST',
    body: {installmentId},
  });
}
