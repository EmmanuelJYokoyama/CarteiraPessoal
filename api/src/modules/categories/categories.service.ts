import {db} from '@db/index';
import {categories} from '@db/schema/categories';
import {eq, and} from 'drizzle-orm';
import type {CreateCategoryInput, UpdateCategoryInput} from './categories.schema';

export async function createCategory(userId: string, input: CreateCategoryInput) {
  const newCategory = await db
    .insert(categories)
    .values({
      userId,
      name: input.name,
      color: input.color || '#2ED573',
    })
    .returning();

  return newCategory[0];
}

export async function getCategoriesByUserId(userId: string) {
  const userCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId));

  return userCategories;
}

export async function getCategoryById(categoryId: string, userId: string) {
  const category = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));

  if (!category || category.length === 0) {
    throw new Error('CATEGORY_NOT_FOUND');
  }

  return category[0];
}

export async function updateCategory(
  categoryId: string,
  userId: string,
  input: UpdateCategoryInput,
) {
  const existingCategory = await getCategoryById(categoryId, userId);

  if (!existingCategory) {
    throw new Error('CATEGORY_NOT_FOUND');
  }

  const updatedCategory = await db
    .update(categories)
    .set({
      name: input.name || existingCategory.name,
      color: input.color || existingCategory.color,
      updatedAt: new Date(),
    })
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .returning();

  return updatedCategory[0];
}

export async function deleteCategory(categoryId: string, userId: string) {
  const existingCategory = await getCategoryById(categoryId, userId);

  if (!existingCategory) {
    throw new Error('CATEGORY_NOT_FOUND');
  }

  await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));

  return {success: true};
}
