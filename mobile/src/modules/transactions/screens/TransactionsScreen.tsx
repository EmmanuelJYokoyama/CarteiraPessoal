import React, {useState, useCallback} from 'react';
import {View, Text, FlatList, Pressable, SafeAreaView, ActivityIndicator} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {AddTransactionForm} from '../components/AddTransactionForm';
import {TransactionDetailsModal} from '../components/TransactionDetailsModal';
import {listTransactions, Transaction} from '@services/api/transactions';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Formatadores
  function formatCurrency(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  }

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, []),
  );

  async function loadTransactions() {
    try {
      setLoading(true);
      const data = await listTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleTransactionAdded() {
    setShowForm(false);
    loadTransactions();
  }



  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#0a0a0a'}}>
      <View style={{flex: 1}}>
        <View style={{padding: 16, borderBottomWidth: 1, borderBottomColor: '#333'}}>
          <Text style={{fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 16, marginTop: 18}}>
            Minhas Despesas
          </Text>
          {!showForm ? (
            <Pressable
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: '#fff',
                borderRadius: 8,
              }}
              onPress={() => setShowForm(true)}>
              <Text style={{color: '#000', textAlign: 'center', fontWeight: '600'}}>
                Nova Despesa
              </Text>
            </Pressable>
          ) : null}
        </View>

        {showForm ? (
          <View style={{flex: 1}}>
            <View style={{padding: 16, alignItems: 'flex-end'}}>
              <Pressable onPress={() => setShowForm(false)}>
                <Text style={{color: '#fff', fontSize: 16}}>✕</Text>
              </Pressable>
            </View>
            <AddTransactionForm onSuccess={handleTransactionAdded} />
          </View>
        ) : (
          <View style={{flex: 1}}>
            {loading ? (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            ) : transactions.length === 0 ? (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{color: '#999', fontSize: 16, textAlign: 'center'}}>
                  Nenhuma despesa registrada ainda
                </Text>
              </View>
            ) : (
              <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => (
                  <Pressable
                    onPress={() => {
                      setSelectedTransaction(item);
                      setShowDetailsModal(true);
                    }}>
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
                          {formatCurrency(item.amount)}
                        </Text>
                      </View>
                      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8}}>
                        <Text style={{fontSize: 12, color: '#999'}}>
                          {item.category}
                        </Text>
                        <Text style={{fontSize: 12, color: '#999'}}>
                          {formatDate(item.transactionDate)}
                        </Text>
                      </View>
                      <View style={{flexDirection: 'row', gap: 8}}>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            backgroundColor: item.status === 'completed' ? 'rgba(46, 213, 115, 0.2)' : 'rgba(241, 196, 15, 0.2)',
                            borderRadius: 4,
                          }}>
                          <Text
                            style={{
                              fontSize: 11,
                              color: item.status === 'completed' ? '#2ed573' : '#f1c40f',
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
                )}
              />
            )}
          </View>
        )}
      </View>

      <TransactionDetailsModal
        visible={showDetailsModal}
        transaction={selectedTransaction}
        onClose={() => setShowDetailsModal(false)}
        onUpdate={handleTransactionAdded}
      />
    </SafeAreaView>
  );
}
