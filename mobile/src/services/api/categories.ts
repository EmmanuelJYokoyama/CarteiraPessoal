import {apiRequest} from './client';

export type Category = {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCategoryPayload = {
  name: string;
  color?: string;
};

export async function listCategories(): Promise<Category[]> {
  return apiRequest('/categories', {
    method: 'GET',
  });
}

export async function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  return apiRequest('/categories', {
    method: 'POST',
    body: payload,
  });
}

export async function getCategoryById(categoryId: string): Promise<Category> {
  return apiRequest(`/categories/${categoryId}`, {
    method: 'GET',
  });
}

export async function updateCategory(
  categoryId: string,
  payload: Partial<CreateCategoryPayload>,
): Promise<Category> {
  return apiRequest(`/categories/${categoryId}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function deleteCategory(categoryId: string): Promise<{success: boolean}> {
  return apiRequest(`/categories/${categoryId}`, {
    method: 'DELETE',
  });
}
