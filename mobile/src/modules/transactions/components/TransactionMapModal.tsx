import React, {useMemo, useState} from 'react';
import {View, Text, Pressable, Modal, FlatList, ScrollView} from 'react-native';
import {X} from 'lucide-react-native';
import {TransactionMapComponent} from './TransactionMapComponent';
import type {Transaction} from '@services/api/transactions';

interface TransactionMapModalProps {
  visible: boolean;
  transactions: Transaction[];
  onClose: () => void;
}

export function TransactionMapModal({visible, transactions, onClose}: TransactionMapModalProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const transactionsWithLocation = useMemo(() => {
    return transactions
      .filter(tx => tx.latitude && tx.longitude)
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }, [transactions]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(value);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{flex: 1, backgroundColor: '#000'}}>
        {/* Header */}
        <View
          style={{
            backgroundColor: '#1a1a1a',
            paddingTop: 16,
            paddingBottom: 12,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#333',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text style={{color: '#fff', fontSize: 18, fontWeight: '700'}}>
            Localização das Despesas
          </Text>
          <Pressable onPress={onClose} style={{padding: 8}}>
            <X size={24} color="#fff" />
          </Pressable>
        </View>

        {/* Mapa */}
        <View style={{flex: 1, position: 'relative'}}>
          <TransactionMapComponent
            transactions={transactionsWithLocation}
            selectedTransaction={selectedTransaction}
            onMarkerPress={setSelectedTransaction}
            height={undefined}
          />

          {/* Info do Marcador Selecionado */}
          {selectedTransaction && (
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: '#1a1a1a',
                borderTopWidth: 1,
                borderTopColor: '#333',
                padding: 16,
              }}>
              <Text style={{color: '#2ed573', fontSize: 12, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase'}}>
                Detalhes
              </Text>
              <Text style={{color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8}}>
                {selectedTransaction.description}
              </Text>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={{color: '#aaa', fontSize: 13}}>
                  {formatDate(selectedTransaction.transactionDate)}
                </Text>
                <Text style={{color: '#2ed573', fontSize: 14, fontWeight: '600'}}>
                  {formatCurrency(selectedTransaction.amount)}
                </Text>
              </View>
              {selectedTransaction.category && (
                <View style={{marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#333'}}>
                  <Text style={{color: '#999', fontSize: 11}}>Categoria</Text>
                  <Text style={{color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 4}}>
                    {selectedTransaction.category}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Lista de Transações com Localização */}
        <View
          style={{
            maxHeight: 200,
            backgroundColor: '#1a1a1a',
            borderTopWidth: 1,
            borderTopColor: '#333',
          }}>
          <Text style={{color: '#aaa', fontSize: 11, paddingHorizontal: 16, paddingTop: 12, marginBottom: 8, textTransform: 'uppercase', fontWeight: '600'}}>
            {transactionsWithLocation.length} Localizações
          </Text>
          <FlatList
            data={transactionsWithLocation}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 12}}
            renderItem={({item}) => (
              <Pressable
                onPress={() => setSelectedTransaction(item)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: selectedTransaction?.id === item.id ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 6,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: selectedTransaction?.id === item.id ? '#2ed573' : '#333',
                }}>
                <Text style={{color: '#fff', fontSize: 12, fontWeight: '600'}}>
                  {item.description.substring(0, 15)}...
                </Text>
                <Text style={{color: '#2ed573', fontSize: 11, fontWeight: '600', marginTop: 4}}>
                  {formatCurrency(item.amount)}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}
