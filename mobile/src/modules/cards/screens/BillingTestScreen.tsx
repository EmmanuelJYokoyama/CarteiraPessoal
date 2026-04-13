import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useBillingStatements, useCardBillingStatement } from '../hooks/useBillingStatements';

/**
 * Tela de teste para o sistema de faturas
 * Use para validar se:
 * - Os endpoints estão funcionando ✅
 * - Os dados são calculados corretamente ✅
 * - Os períodos de fatura são precisos ✅
 */
export function BillingTestScreen() {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Hook 1: Listar todas as faturas do usuário
  const {
    statements: allStatements,
    loading: loadingAll,
    error: errorAll,
    reload: reloadAll,
  } = useBillingStatements();

  // Hook 2: Detalhar uma fatura específica + breakdown por categoria
  const {
    statement: detailStatement,
    categories,
    loading: loadingDetail,
    error: errorDetail,
    reload: reloadDetail,
  } = useCardBillingStatement(selectedCardId || '');

  React.useEffect(() => {
    if (selectedCardId) {
      reloadDetail();
    }
  }, [selectedCardId]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧪 Teste de Faturas</Text>

      {/* Seção 1: Lista de todas as faturas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1️⃣ Todas as Faturas</Text>

        {loadingAll && <ActivityIndicator size="large" color="#007AFF" />}
        {errorAll && (
          <View style={styles.error}>
            <Text style={styles.errorText}>❌ Erro: {errorAll}</Text>
            <TouchableOpacity style={styles.button} onPress={reloadAll}>
              <Text style={styles.buttonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {allStatements && allStatements.length === 0 && (
          <Text style={styles.emptyText}>Nenhum cartão encontrado</Text>
        )}

        {allStatements && allStatements.length > 0 && (
          <View>
            <Text style={styles.infoText}>
              📊 Total de cartões: {allStatements.length}
            </Text>

            {allStatements.map((card) => (
              <TouchableOpacity
                key={card.cardId}
                style={[
                  styles.cardButton,
                  selectedCardId === card.cardId && styles.cardButtonActive,
                ]}
                onPress={() => setSelectedCardId(card.cardId)}
              >
                <Text style={styles.cardName}>{card.cardName}</Text>
                <Text style={styles.cardValue}>
                  R$ {Number(card.totalAmount).toFixed(2)}
                </Text>
                <Text style={styles.cardPeriod}>
                  {new Date(card.billingPeriod.startDate).toLocaleDateString()} →{' '}
                  {new Date(card.billingPeriod.endDate).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Seção 2: Detalhe do cartão selecionado */}
      {selectedCardId && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2️⃣ Detalhe da Fatura</Text>

          {loadingDetail && <ActivityIndicator size="large" color="#007AFF" />}
          {errorDetail && (
            <View style={styles.error}>
              <Text style={styles.errorText}>❌ Erro: {errorDetail}</Text>
              <TouchableOpacity style={styles.button} onPress={reloadDetail}>
                <Text style={styles.buttonText}>Tentar Novamente</Text>
              </TouchableOpacity>
            </View>
          )}

          {detailStatement && (
            <View style={styles.statementDetail}>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Cartão:</Text>
                <Text style={styles.value}>{detailStatement.cardName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Período:</Text>
                <Text style={styles.value}>
                  {new Date(
                    detailStatement.billingPeriod.startDate
                  ).toLocaleDateString()}{' '}
                  →{' '}
                  {new Date(
                    detailStatement.billingPeriod.endDate
                  ).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Dia de Fechamento:</Text>
                <Text style={styles.value}>
                  {detailStatement.billingPeriod.closingDay}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Dia de Vencimento:</Text>
                <Text style={styles.value}>
                  {detailStatement.billingPeriod.dueDay}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.amountBox}>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Total:</Text>
                  <Text style={styles.amountTotal}>
                    R$ {Number(detailStatement.totalAmount).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Completadas:</Text>
                  <Text style={styles.amountCompleted}>
                    R$ {Number(detailStatement.completedAmount).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Pendentes:</Text>
                  <Text style={styles.amountPending}>
                    R$ {Number(detailStatement.pendingAmount).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Transações da fatura */}
              {detailStatement.transactions && (
                <View style={styles.transactionsSection}>
                  <Text style={styles.transactionsTitle}>
                    📝 Transações ({detailStatement.transactions.length})
                  </Text>

                  {detailStatement.transactions.length === 0 ? (
                    <Text style={styles.emptyText}>
                      Nenhuma transação neste período
                    </Text>
                  ) : (
                    detailStatement.transactions.map((tx) => (
                      <View key={tx.id} style={styles.transactionCard}>
                        <View style={styles.txHeader}>
                          <Text style={styles.txDescription}>
                            {tx.description}
                          </Text>
                          <Text
                            style={[
                              styles.txAmount,
                              tx.status === 'completed'
                                ? styles.txAmountCompleted
                                : styles.txAmountPending,
                            ]}
                          >
                            -R$ {Number(tx.amount).toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.txFooter}>
                          <Text style={styles.txCategory}>{tx.category}</Text>
                          <Text style={styles.txStatus}>
                            {tx.status === 'completed' ? '✅' : '⏳'}{' '}
                            {tx.status === 'completed'
                              ? 'Completada'
                              : 'Pendente'}
                          </Text>
                        </View>
                        <Text style={styles.txDate}>
                          {new Date(tx.transactionDate).toLocaleDateString()}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* Breakdown por categoria */}
              {categories && categories.length > 0 && (
                <View style={styles.categoriesSection}>
                  <Text style={styles.categoriesTitle}>
                    📊 Gastos por Categoria
                  </Text>

                  {categories.map((cat) => (
                    <View key={cat.category} style={styles.categoryCard}>
                      <View style={styles.categoryHeader}>
                        <Text style={styles.categoryName}>{cat.category}</Text>
                        <Text style={styles.categoryCount}>
                          {cat.count}x
                        </Text>
                      </View>
                      <Text style={styles.categoryTotal}>
                        R$ {Number(cat.total).toFixed(2)}
                      </Text>
                      <View
                        style={[
                          styles.categoryBar,
                          {
                            width: `${
                              (Number(cat.total) /
                                Number(
                                  detailStatement?.totalAmount || cat.total
                                )) *
                              100
                            }%`,
                          },
                        ]}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Instruções */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Como Testar</Text>
        <Text style={styles.instruction}>
          1. Certifique-se que tem cartões e transações cadastrados{'\n'}
          2. Clique em um cartão acima para ver os detalhes{'\n'}
          3. Valide: {'\n'}
          &nbsp;&nbsp;- O período está correto? {'\n'}
          &nbsp;&nbsp;- O total bate com as transações? {'\n'}
          &nbsp;&nbsp;- As categorias estão agrupadas? {'\n'}
          4. Se não vir nada, verifique o console para erros
        </Text>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#000',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#007AFF',
  },
  cardButton: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
  },
  cardButtonActive: {
    backgroundColor: '#E3F2FD',
    borderLeftColor: '#007AFF',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  cardValue: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '700',
    marginTop: 4,
  },
  cardPeriod: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statementDetail: {
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontWeight: '600',
    color: '#333',
  },
  value: {
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  amountBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  amountLabel: {
    fontWeight: '500',
    color: '#666',
  },
  amountTotal: {
    fontWeight: '700',
    fontSize: 16,
    color: '#000',
  },
  amountCompleted: {
    fontWeight: '600',
    color: '#4CAF50',
  },
  amountPending: {
    fontWeight: '600',
    color: '#FF9800',
  },
  transactionsSection: {
    marginTop: 16,
  },
  transactionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  transactionCard: {
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  txDescription: {
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  txAmount: {
    fontWeight: '600',
    color: '#333',
  },
  txAmountCompleted: {
    color: '#4CAF50',
  },
  txAmountPending: {
    color: '#FF9800',
  },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  txCategory: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  txStatus: {
    fontSize: 12,
    color: '#666',
  },
  txDate: {
    fontSize: 11,
    color: '#999',
  },
  categoriesSection: {
    marginTop: 16,
  },
  categoriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  categoryCard: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryName: {
    fontWeight: '600',
    color: '#000',
  },
  categoryCount: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 6,
  },
  categoryBar: {
    height: 6,
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  error: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  errorText: {
    color: '#C62828',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20,
  },
  infoText: {
    color: '#666',
    marginBottom: 12,
    fontWeight: '500',
  },
  instruction: {
    color: '#333',
    lineHeight: 20,
  },
});
