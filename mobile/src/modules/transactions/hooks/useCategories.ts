import {useState, useEffect, useCallback} from 'react';
import {listCategories, createCategory, Category, CreateCategoryPayload} from '@services/api/categories';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listCategories();
      setCategories(data);
    } catch (err: any) {
      const message = err.message || 'Erro ao carregar categorias';
      setError(message);
      console.error('Erro ao carregar categorias:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = useCallback(async (payload: CreateCategoryPayload) => {
    try {
      const newCategory = await createCategory(payload);
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (err: any) {
      const message = err.message || 'Erro ao criar categoria';
      setError(message);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    loadCategories,
    addCategory,
  };
}
