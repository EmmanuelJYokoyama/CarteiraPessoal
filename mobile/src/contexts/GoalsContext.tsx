import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
  category: string;
};

type Contribution = {
  id: string;
  amount: number;
  note: string;
  date: string;
};

type GoalsContextType = {
  activeGoal: Goal;
  contributions: Contribution[];
  isLoading: boolean;
  addContribution: (amount: number, note: string) => void;
};

const GOALS_STORAGE_KEY = '@goals_data';

const defaultGoal: Goal = {
  id: 'goal-1',
  name: 'Reserva de emergência',
  target: 10000,
  current: 6700,
  deadline: '30/08/2026',
  category: 'Poupança',
};

const defaultContributions: Contribution[] = [
  {id: 'c1', amount: 500, note: 'Salário', date: '08/05/2026'},
  {id: 'c2', amount: 300, note: 'Renda extra', date: '05/05/2026'},
  {id: 'c3', amount: 150, note: 'Sobra do mês', date: '28/04/2026'},
  {id: 'c4', amount: 250, note: 'Venda de item', date: '18/04/2026'},
  {id: 'c5', amount: 400, note: 'Bônus', date: '04/04/2026'},
  {id: 'c6', amount: 100, note: 'Ajuste', date: '01/04/2026'},
];

type StoredGoalsData = {
  activeGoal: Goal;
  contributions: Contribution[];
};

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({children}: {children: React.ReactNode}) {
  const [activeGoal, setActiveGoal] = useState<Goal>(defaultGoal);
  const [contributions, setContributions] = useState<Contribution[]>(defaultContributions);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const raw = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<StoredGoalsData>;
          if (parsed.activeGoal) {
            setActiveGoal(parsed.activeGoal);
          }
          if (Array.isArray(parsed.contributions)) {
            setContributions(parsed.contributions);
          }
        }
      } catch (error) {
        console.error('[GoalsContext] Failed to restore goals data', error);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const persist = async () => {
      try {
        await AsyncStorage.setItem(
          GOALS_STORAGE_KEY,
          JSON.stringify({activeGoal, contributions} satisfies StoredGoalsData),
        );
      } catch (error) {
        console.error('[GoalsContext] Failed to persist goals data', error);
      }
    };

    persist();
  }, [activeGoal, contributions, isLoading]);

  const value = useMemo<GoalsContextType>(() => ({
    activeGoal,
    contributions,
    isLoading,
    addContribution: (amount: number, note: string) => {
      const contribution: Contribution = {
        id: `${Date.now()}`,
        amount,
        note,
        date: new Date().toLocaleDateString('pt-BR'),
      };

      setContributions(current => [contribution, ...current]);
      setActiveGoal(current => ({
        ...current,
        current: current.current + amount,
      }));
    },
  }), [activeGoal, contributions, isLoading]);

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoalsContext() {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoalsContext must be used within a GoalsProvider');
  }
  return context;
}
