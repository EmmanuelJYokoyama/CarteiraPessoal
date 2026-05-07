import {useState, useCallback, useEffect} from 'react';
import {Alert} from 'react-native';
import {updateTransaction, deleteTransaction, payInstallment, getTransaction, Transaction, Installment} from '@services/api/transactions';
import {invalidateCache} from '@services/cache';

export function useTransactionModal(transaction: Transaction, onUpdate: () => void, onClose: () => void, isVisible: boolean = true) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedAmount, setEditedAmount] = useState('');
  const [editedCategory, setEditedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [showInstallmentPicker, setShowInstallmentPicker] = useState(false);

  const syncState = useCallback(() => {
    setEditedDescription(transaction.description);
    setEditedAmount(transaction.amount.toString());
    setEditedCategory(transaction.category || '');
  }, [transaction]);

  useEffect(() => {
    if (transaction.installments > 1 && isVisible) {
      loadInstallments();
    }
  }, [transaction.id, isVisible]);

  const loadInstallments = useCallback(async () => {
    try {
      const response = await getTransaction(transaction.id);
      if (response.installments) {
        setInstallments(response.installments);
      }
    } catch (error) {
      console.error('Erro ao carregar parcelas:', error);
    }
  }, [transaction.id]);

  const handleComplete = useCallback(async () => {
    try {
      setIsLoading(true);
      if (transaction.installments > 1) {
        const nextPendingInstallment = installments.find(inst => inst.status === 'pending');
        if (nextPendingInstallment) {
          await payInstallment(nextPendingInstallment.id);
          await loadInstallments();
        } else {
          Alert.alert('Aviso', 'Todas as parcelas já foram pagas');
          return;
        }
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
  }, [transaction, installments, onUpdate, onClose, loadInstallments]);

  const handlePaySpecificInstallment = useCallback(async (installmentId: string) => {
    try {
      setIsLoading(true);
      await payInstallment(installmentId);
      await loadInstallments();
      await invalidateCache('transactions');
      setShowInstallmentPicker(false);
      onUpdate();
      onClose();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao pagar parcela');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [onUpdate, onClose, loadInstallments]);

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
    handlePaySpecificInstallment,
    handleSaveEdit,
    handleDelete,
    installments,
    showInstallmentPicker,
    setShowInstallmentPicker,
  };
}
