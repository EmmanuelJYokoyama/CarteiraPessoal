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
  goalId: string;
  amount: number;
  note: string;
  date: string;
};

type GoalsContextType = {
  activeGoal: Goal;
  allGoals: Goal[];
  contributions: Contribution[];
  isLoading: boolean;
  setGoal: (goal: Omit<Goal, 'id'>) => void;
  selectGoal: (goalId: string) => void;
  deleteGoal: (goalId: string) => void;
  addContribution: (amount: number, note: string) => void;
  updateContribution: (id: string, amount: number, note: string) => void;
  deleteContribution: (id: string) => void;
};

const GOALS_STORAGE_KEY = '@goals_data';

const defaultGoal: Goal = {
  id: 'goal-empty',
  name: 'Sem meta definida',
  target: 0,
  current: 0,
  deadline: '--/--/----',
  category: 'Não definido',
};

const defaultContributions: Contribution[] = [];

type StoredGoalsData = {
  allGoals: Goal[];
  activeGoalId: string;
  contributions: Contribution[];
};

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({children}: {children: React.ReactNode}) {
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [activeGoalId, setActiveGoalId] = useState<string>('goal-empty');
  const [contributions, setContributions] = useState<Contribution[]>(defaultContributions);
  const [isLoading, setIsLoading] = useState(true);

  const activeGoal = useMemo(() => {
    return allGoals.find(g => g.id === activeGoalId) || defaultGoal;
  }, [allGoals, activeGoalId]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const raw = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<StoredGoalsData>;
          if (isLegacySeededGoalData(parsed)) {
            setAllGoals([]);
            setActiveGoalId('goal-empty');
            setContributions([]);
            return;
          }

          if (Array.isArray(parsed.allGoals) && parsed.allGoals.length > 0) {
            setAllGoals(parsed.allGoals);
            setActiveGoalId(parsed.activeGoalId || parsed.allGoals[0].id);
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
          JSON.stringify({
            allGoals,
            activeGoalId,
            contributions,
          } satisfies StoredGoalsData),
        );
      } catch (error) {
        console.error('[GoalsContext] Failed to persist goals data', error);
      }
    };

    persist();
  }, [allGoals, activeGoalId, contributions, isLoading]);

  const value = useMemo<GoalsContextType>(() => ({
    activeGoal,
    allGoals,
    contributions,
    isLoading,
    setGoal: goal => {
      const newGoal: Goal = {
        id: `goal-${Date.now()}`,
        name: goal.name,
        target: goal.target,
        current: goal.current,
        deadline: goal.deadline,
        category: goal.category,
      };
      setAllGoals(current => [...current, newGoal]);
      setActiveGoalId(newGoal.id);
      setContributions(current => current.filter(c => c.goalId === newGoal.id));
    },
    selectGoal: goalId => {
      setActiveGoalId(goalId);
    },
    deleteGoal: goalId => {
      setAllGoals(current => current.filter(g => g.id !== goalId));
      setContributions(current => current.filter(c => c.goalId !== goalId));
      
      if (activeGoalId === goalId) {
        const remaining = allGoals.filter(g => g.id !== goalId);
        if (remaining.length > 0) {
          setActiveGoalId(remaining[0].id);
        } else {
          setActiveGoalId('goal-empty');
        }
      }
    },
    addContribution: (amount: number, note: string) => {
      const contribution: Contribution = {
        id: `${Date.now()}`,
        goalId: activeGoalId,
        amount,
        note,
        date: new Date().toLocaleDateString('pt-BR'),
      };

      setContributions(current => [contribution, ...current]);
      setAllGoals(current =>
        current.map(g =>
          g.id === activeGoalId
            ? {
                ...g,
                current: Number.isFinite(g.current) ? g.current + amount : amount,
              }
            : g,
        ),
      );
    },
    updateContribution: (id: string, amount: number, note: string) => {
      setContributions(current => {
        const oldContribution = current.find(c => c.id === id);
        if (!oldContribution) return current;

        const amountDiff = amount - oldContribution.amount;

        setAllGoals(goals =>
          goals.map(g =>
            g.id === oldContribution.goalId
              ? {
                  ...g,
                  current: Number.isFinite(g.current) ? g.current + amountDiff : amount,
                }
              : g,
          ),
        );

        return current.map(c =>
          c.id === id ? {...c, amount, note} : c,
        );
      });
    },
    deleteContribution: (id: string) => {
      setContributions(current => {
        const contribution = current.find(c => c.id === id);
        if (!contribution) return current;

        setAllGoals(goals =>
          goals.map(g =>
            g.id === contribution.goalId
              ? {
                  ...g,
                  current: Math.max(0, g.current - contribution.amount),
                }
              : g,
          ),
        );

        return current.filter(c => c.id !== id);
      });
    },
  }), [activeGoal, allGoals, contributions, activeGoalId, isLoading]);

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoalsContext() {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoalsContext must be used within a GoalsProvider');
  }
  return context;
}

function isLegacySeededGoalData(data: Partial<StoredGoalsData>): boolean {
  const goals = data.allGoals;
  const contributions = data.contributions;

  const hasLegacyGoal =
    Array.isArray(goals) &&
    goals.some(g =>
      g.id === 'goal-1' &&
      g.name === 'Reserva de emergência' &&
      g.target === 10000 &&
      g.current === 6700
    );

  const hasLegacyContributions =
    Array.isArray(contributions) &&
    contributions.length > 0 &&
    contributions.every(item => /^c\d+$/.test(item.id));

  return hasLegacyGoal || hasLegacyContributions;
}
