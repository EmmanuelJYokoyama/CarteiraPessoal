import React, {useState, useCallback, useMemo} from 'react';
import {View, Text, FlatList, Pressable, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {Upload} from 'lucide-react-native';
import {useAuth} from '@contexts/AuthContext';
import {API_BASE_URL} from '@services/api/client';
import {downloadPdfReport} from '@services/reports';
import {ActivityIndicator as AI} from 'react-native';
import {AddTransactionForm} from '../components/AddTransactionForm';
import {TransactionDetailsModal} from '../components/TransactionDetailsModal';
import {TransactionListItem} from '../components/TransactionListItem';
import {listTransactions, Transaction} from '@services/api/transactions';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Transactions'>;

export default function TransactionsScreen({navigation}: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const {userToken} = useAuth();
  const [exporting, setExporting] = useState(false);

  // Remover formatadores que agora estão no componente
  const memoizedTransactions = useMemo(() => transactions, [transactions]);

  const handleTransactionPress = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setSkip(0);
      setHasMore(true);
      loadTransactions();
    }, []),
  );

  async function loadTransactions(reset = true) {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await listTransactions(reset ? 0 : skip, 20);
      setTransactions(prev => (reset ? response.items : [...prev, ...response.items]));
      setSkip(prev => (reset ? response.items.length : prev + response.items.length));
      setHasMore(response.pageInfo.hasMore);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar despesas';
      console.error('Erro ao carregar despesas:', message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function handleTransactionAdded() {
    setShowForm(false);
    setSkip(0);
    setHasMore(true);
    loadTransactions(true);
  }

  function handleTransactionDeleted() {
    setShowDetailsModal(false);
    setSkip(0);
    setHasMore(true);
    loadTransactions(true);
  }

  async function handleLoadMore() {
    if (loading || loadingMore || !hasMore) {
      return;
    }

    await loadTransactions(false);
  }



  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#0a0a0a'}}>
      <View style={{flex: 1}}>
        <View style={{padding: 16, borderBottomWidth: 1, borderBottomColor: '#333'}}>
          <Text style={{fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 16, marginTop: 18}}>
            Minhas Despesas
          </Text>
          {!showForm ? (
            <View style={{gap: 12}}>
              <Pressable
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: '#fff',
                  borderRadius: 8,
                }}
                onPress={() => setShowForm(true)}>
                <Text style={{color: '#000', textAlign: 'center', fontWeight: '600'}}>
                  + Nova Despesa
                </Text>
              </Pressable>
              <View style={{flexDirection: 'row', gap: 12}}>
                <Pressable
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#3498db',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                  onPress={() => navigation.navigate('ImportStatement')}>
                  <Upload size={18} color="#3498db" />
                  <Text style={{color: '#3498db', textAlign: 'center', fontWeight: '600'}}>
                    Importar
                  </Text>
                </Pressable>
                <Pressable
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: 'rgba(46, 204, 113, 0.12)',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#2ecc71',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                  onPress={async () => {
                    try {
                      setExporting(true);
                      const path = await downloadPdfReport(API_BASE_URL, userToken ?? '', {});
                      setExporting(false);
                      navigation.navigate('PdfViewer', {path});
                    } catch (err) {
                      console.error('Failed to export PDF', err);
                      setExporting(false);
                    }
                  }}>
                  {exporting ? (
                    <AI size={18} color="#2ecc71" />
                  ) : (
                    <Text style={{color: '#2ecc71', textAlign: 'center', fontWeight: '600'}}>Exportar PDF</Text>
                  )}
                </Pressable>

              </View>
            </View>
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
                data={memoizedTransactions}
                keyExtractor={(item) => item.id}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.6}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                initialNumToRender={20}
                ListFooterComponent={loadingMore ? (
                  <View style={{paddingVertical: 16}}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                ) : null}
                renderItem={({item}) => (
                  <TransactionListItem
                    item={item}
                    onPress={() => handleTransactionPress(item)}
                  />
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
        onUpdate={handleTransactionDeleted}
        onShowMap={() => {
          if (selectedTransaction?.latitude && selectedTransaction?.longitude) {
            setShowDetailsModal(false);
            navigation.navigate('TransactionMap', {transaction: selectedTransaction});
          }
        }}
      />
    </SafeAreaView>
  );
}
