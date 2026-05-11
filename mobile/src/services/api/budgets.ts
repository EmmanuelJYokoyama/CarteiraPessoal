import {apiRequest} from './client';
import {invalidateCache} from '@services/cache';

export type Budget = {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category?: string;
  cardId?: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateBudgetPayload = {
  name: string;
  amount: string;
  category?: string;
  cardId?: string;
  periodStart: string;
  periodEnd: string;
};

export type UpdateBudgetPayload = Partial<CreateBudgetPayload>;

export type BudgetProgress = {
  budget: Budget;
  totalSpent: string;
  limit: string;
  percent: number;
  remaining: string;
};

export async function createBudget(payload: CreateBudgetPayload) {
  const response = await apiRequest<Budget>('/budgets', {
    method: 'POST',
    body: payload,
  });

  await invalidateCache('budgets');

  return response;
}

export async function listBudgets() {
  return apiRequest<Budget[]>('/budgets', {
    method: 'GET',
  });
}

export async function getBudget(budgetId: string) {
  return apiRequest<Budget>(`/budgets/${budgetId}`, {
    method: 'GET',
  });
}

export async function updateBudget(budgetId: string, payload: UpdateBudgetPayload) {
  const response = await apiRequest<{budget: Budget}>(`/budgets/${budgetId}`, {
    method: 'PUT',
    body: payload,
  });

  await invalidateCache('budgets');

  return response;
}

export async function deleteBudget(budgetId: string) {
  const response = await apiRequest<{message: string}>(`/budgets/${budgetId}`, {
    method: 'DELETE',
  });

  await invalidateCache('budgets');

  return response;
}

export async function getBudgetProgress(budgetId: string) {
  return apiRequest<BudgetProgress>(`/budgets/${budgetId}/progress`, {
    method: 'GET',
  });
}
