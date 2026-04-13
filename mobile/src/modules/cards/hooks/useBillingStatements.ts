import {useState, useEffect, useCallback} from 'react';
import {
  getUserBillingStatements,
  getCardBillingStatement,
  getCardStatementByCategory,
  type CardBillingStatement,
  type CategoryBreakdown,
} from '@services/api/billing';

export function useBillingStatements() {
  const [statements, setStatements] = useState<CardBillingStatement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserBillingStatements();
      setStatements(data);
    } catch (err: any) {
      const message = err.message || 'Erro ao carregar faturas';
      setError(message);
      console.error('Erro ao carregar faturas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatements();
  }, [loadStatements]);

  return {
    statements,
    loading,
    error,
    loadStatements,
  };
}

export function useCardBillingStatement(cardId: string) {
  const [statement, setStatement] = useState<CardBillingStatement | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatement = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statementData, categoriesData] = await Promise.all([
        getCardBillingStatement(cardId),
        getCardStatementByCategory(cardId),
      ]);

      setStatement(statementData);
      setCategories(categoriesData);
    } catch (err: any) {
      const message = err.message || 'Erro ao carregar fatura';
      setError(message);
      console.error('Erro ao carregar fatura:', err);
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    if (cardId) {
      loadStatement();
    }
  }, [cardId, loadStatement]);

  return {
    statement,
    categories,
    loading,
    error,
    reload: loadStatement,
  };
}
