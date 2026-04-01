import {useEffect, useState} from 'react';
import {listCards, type Card} from '@services/api/cards';

export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCards();
  }, []);

  async function loadCards() {
    try {
      setLoading(true);
      setError(null);
      const data = await listCards();
      setCards(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar cartões';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    await loadCards();
  }

  return {
    cards,
    loading,
    error,
    refresh,
  };
}
