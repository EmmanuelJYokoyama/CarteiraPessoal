import {useState, useCallback} from 'react';
import {Alert} from 'react-native';
import {updateTransaction, deleteTransaction, payInstallment, Transaction} from '@services/api/transactions';
import {invalidateCache} from '@services/cache';

export function useTransactionModal(transaction: Transaction, onUpdate: () => void, onClose: () => void) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedAmount, setEditedAmount] = useState('');
  const [editedCategory, setEditedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const syncState = useCallback(() => {
    setEditedDescription(transaction.description);
    setEditedAmount(transaction.amount);
    setEditedCategory(transaction.category || '');
  }, [transaction]);

  const handleComplete = useCallback(async () => {
    try {
      setIsLoading(true);
      if (transaction.installments > 1) {
        await payInstallment(transaction.id);
      } else {
        await updateTransaction(transaction.id, {status: 'completed'});
      }
      await invalidateCache('transactions');
      onUpdate();
      onClose();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao concluir transação');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [transaction, onUpdate, onClose]);

  const handleSaveEdit = useCallback(async () => {
    if (!editedDescription.trim() || !editedAmount) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      setIsLoading(true);
      await updateTransaction(transaction.id, {
        description: editedDescription,
        amount: editedAmount,
        category: editedCategory,
      });
      await invalidateCache('transactions');
      setIsEditing(false);
      onUpdate();
      onClose();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar transação');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [editedDescription, editedAmount, editedCategory, transaction.id, onUpdate, onClose]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Deletar',
      'Tem certeza que deseja deletar esta transação?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteTransaction(transaction.id);
              await invalidateCache('transactions');
              onUpdate();
              onClose();
            } catch (error) {
              Alert.alert('Erro', 'Falha ao deletar transação');
              console.error(error);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  }, [transaction.id, onUpdate, onClose]);

  return {
    isEditing,
    setIsEditing,
    editedDescription,
    setEditedDescription,
    editedAmount,
    setEditedAmount,
    editedCategory,
    setEditedCategory,
    isLoading,
    syncState,
    handleComplete,
    handleSaveEdit,
    handleDelete,
  };
}
