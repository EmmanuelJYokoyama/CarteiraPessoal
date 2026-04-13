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
  return apiRequest('GET', '/categories');
}

export async function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  return apiRequest('POST', '/categories', payload);
}

export async function getCategoryById(categoryId: string): Promise<Category> {
  return apiRequest('GET', `/categories/${categoryId}`);
}

export async function updateCategory(
  categoryId: string,
  payload: Partial<CreateCategoryPayload>,
): Promise<Category> {
  return apiRequest('PUT', `/categories/${categoryId}`, payload);
}

export async function deleteCategory(categoryId: string): Promise<{success: boolean}> {
  return apiRequest('DELETE', `/categories/${categoryId}`);
}
