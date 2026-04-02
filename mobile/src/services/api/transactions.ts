import {apiRequest} from './client';

export type CreateTransactionPayload = {
  cardId?: string;
  description: string;
  amount: string;
  installments?: number;
  category?: string;
  transactionDate: string;
};

export type Transaction = {
  id: string;
  userId: string;
  cardId?: string;
  description: string;
  amount: string;
  installments: number;
  installmentsPaid: number;
  category?: string;
  status: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
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

export async function createTransaction(payload: CreateTransactionPayload) {
  return apiRequest<CreateTransactionResponse>('/transactions', {
    method: 'POST',
    body: payload,
  });
}

export async function listTransactions() {
  return apiRequest<ListTransactionsResponse>('/transactions', {
    method: 'GET',
    cacheTTL: 300000,
  });
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
  return apiRequest<{transaction: Transaction}>(`/transactions/${transactionId}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function deleteTransaction(transactionId: string) {
  return apiRequest<{message: string}>(`/transactions/${transactionId}`, {
    method: 'DELETE',
  });
}

export async function payInstallment(installmentId: string) {
  return apiRequest<{message: string}>('/installments/pay', {
    method: 'POST',
    body: {installmentId},
  });
}
