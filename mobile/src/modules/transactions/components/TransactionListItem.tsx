import React, {useMemo} from 'react';
import {View, Text, Pressable} from 'react-native';
import {Transaction} from '@services/api/transactions';

interface TransactionListItemProps {
  item: Transaction;
  onPress: () => void;
}

/**
 * Componente otimizado para item de transação
 * Usa React.memo para evitar re-renders desnecessários
 * Usa useMemo para formatação de valores (currency, date)
 */
export const TransactionListItem = React.memo(
  ({item, onPress}: TransactionListItemProps) => {
    // Memoizar formatação de moeda
    const formattedAmount = useMemo(() => {
      const num = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;
      if (isNaN(num)) return 'R$ 0,00';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(num);
    }, [item.amount]);

    // Memoizar formatação de data
    const formattedDate = useMemo(() => {
      try {
        const date = new Date(item.transactionDate);
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      } catch {
        return item.transactionDate;
      }
    }, [item.transactionDate]);

    // Memoizar cores de status
    const statusColors = useMemo(() => ({
      backgroundColor: item.status === 'completed' 
        ? 'rgba(46, 213, 115, 0.2)' 
        : 'rgba(241, 196, 15, 0.2)',
      textColor: item.status === 'completed' ? '#2ed573' : '#f1c40f',
    }), [item.status]);

    return (
      <Pressable onPress={onPress}>
        <View
          style={{
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#333',
          }}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
            <Text style={{fontSize: 16, fontWeight: '600', color: '#fff', flex: 1}}>
              {item.description}
            </Text>
            <Text style={{fontSize: 16, fontWeight: '600', color: '#fff'}}>
              {formattedAmount}
            </Text>
          </View>
          
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8}}>
            <Text style={{fontSize: 12, color: '#999'}}>
              {item.category || 'Sem categoria'}
            </Text>
            <Text style={{fontSize: 12, color: '#999'}}>
              {formattedDate}
            </Text>
          </View>
          
          <View style={{flexDirection: 'row', gap: 8}}>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: statusColors.backgroundColor,
                borderRadius: 4,
              }}>
              <Text
                style={{
                  fontSize: 11,
                  color: statusColors.textColor,
                  fontWeight: '600',
                }}>
                {item.status === 'completed' ? 'Concluído' : 'Pendente'}
              </Text>
            </View>
            
            {item.installments > 1 && (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  backgroundColor: 'rgba(52, 152, 219, 0.2)',
                  borderRadius: 4,
                }}>
                <Text style={{fontSize: 11, color: '#3498db', fontWeight: '600'}}>
                  {item.installmentsPaid}/{item.installments}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  },
  // Comparação customizada para memo
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.status === nextProps.item.status &&
      prevProps.item.amount === nextProps.item.amount &&
      prevProps.item.description === nextProps.item.description &&
      prevProps.item.installmentsPaid === nextProps.item.installmentsPaid
    );
  }
);

TransactionListItem.displayName = 'TransactionListItem';
