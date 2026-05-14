import {useState, useCallback} from 'react';
import {Alert} from 'react-native';
import {createBudget, updateBudget, deleteBudget, type CreateBudgetPayload, type UpdateBudgetPayload} from '@services/api/budgets';

export function useBudgetForm(budgetId?: string, initialData?: any, onSuccess?: () => void, onClose?: () => void) {
  const [name, setName] = useState(initialData?.name || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || '');
  const [selectedCard, setSelectedCard] = useState(initialData?.cardId || null);
  const [periodStart, setPeriodStart] = useState<Date | null>(
    initialData?.periodStart ? new Date(initialData.periodStart) : null,
  );
  const [periodEnd, setPeriodEnd] = useState<Date | null>(
    initialData?.periodEnd ? new Date(initialData.periodEnd) : null,
  );
  const [periodType, setPeriodType] = useState<'monthly' | 'custom'>('custom');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateForm = useCallback((): boolean => {
    if (!name.trim()) {
      setErrorMessage('Nome do orçamento obrigatório');
      return false;
    }
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      setErrorMessage('Valor deve ser um número maior que zero');
      return false;
    }
    if (!periodStart || !periodEnd) {
      setErrorMessage('Defina o período inicial e final');
      return false;
    }
    if (periodStart >= periodEnd) {
      setErrorMessage('Data final deve ser após a data inicial');
      return false;
    }
    setErrorMessage('');
    return true;
  }, [name, amount, periodStart, periodEnd]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const payload = {
        name: name.trim(),
        amount,
        category: selectedCategory || undefined,
        cardId: selectedCard || undefined,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      };

      if (budgetId) {
        await updateBudget(budgetId, payload as UpdateBudgetPayload);
        Alert.alert('Sucesso', 'Orçamento atualizado!');
      } else {
        await createBudget(payload as CreateBudgetPayload);
        Alert.alert('Sucesso', 'Orçamento criado!');
      }
      onSuccess?.();
      onClose?.();
    } catch (error: any) {
      const message = error.message || 'Erro ao salvar orçamento';
      setErrorMessage(message);
      Alert.alert('Erro', message);
    } finally {
      setIsLoading(false);
    }
  }, [budgetId, validateForm, name, amount, selectedCategory, selectedCard, periodStart, periodEnd, onSuccess, onClose]);

  const handleDelete = useCallback(() => {
    if (!budgetId) return;
    Alert.alert('Deletar', 'Tem certeza que deseja deletar este orçamento?', [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Deletar',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoading(true);
            await deleteBudget(budgetId);
            Alert.alert('Sucesso', 'Orçamento deletado!');
            onSuccess?.();
            onClose?.();
          } catch (error: any) {
            Alert.alert('Erro', error.message || 'Erro ao deletar orçamento');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  }, [budgetId, onSuccess, onClose]);

  return {
    name,
    setName,
    amount,
    setAmount,
    selectedCategory,
    setSelectedCategory,
    selectedCard,
    setSelectedCard,
    periodStart,
    setPeriodStart,
    periodEnd,
    setPeriodEnd,
    periodType,
    setPeriodType,
    isLoading,
    errorMessage,
    handleSave,
    handleDelete,
  };
}
