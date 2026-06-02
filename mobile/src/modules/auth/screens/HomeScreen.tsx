import React, {useState, useCallback, useMemo} from 'react';
import {View, Text, Pressable, Modal, ScrollView, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '@contexts/AuthContext';
import {useGoalsContext} from '@contexts/GoalsContext';
import {apiRequest} from '@services/api/client';
import {listAllTransactions, type Transaction} from '@services/api/transactions';
import {listCards, type Card} from '@services/api/cards';
import {useOfflineSync} from '@hooks/useOfflineSync';
import {BarChartCard} from '@components/charts';
import {TrendingDown, CreditCard, AlertCircle, PieChart as PieChartIcon, ArrowRight} from 'lucide-react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {styles} from './styles/HomeScreen.styles';

type Props = NativeStackScreenProps<any, 'Home'>;

export default function HomeScreen({navigation}: Props) {
  const {signOut, user} = useAuth();
  const {activeGoal} = useGoalsContext();
  useOfflineSync({monitorConnectivity: false});
  const [menuVisible, setMenuVisible] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const initials = user?.name?.charAt(0)?.toUpperCase() || '👤';

  // Carregar dados do dashboard quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, []),
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [txs, cardsData] = await Promise.all([
        listAllTransactions(),
        listCards(),
      ]);
      setTransactions(txs);
      setCards(cardsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    await signOut();
  };

  const now = new Date();
  const currentMonth = now.getUTCMonth();
  const currentYear = now.getUTCFullYear();

  // Only count non-installment transactions in this month
  const monthlyTransactions = transactions.filter(tx => {
    try {
      // Only include transactions without installments (installments === 1)
      if (tx.installments > 1) {
        return false; // Skip installment transactions - we'll count them via installmentDetails
      }
      
      // Parse the date - transactionDate is always a string
      const date = new Date(tx.transactionDate);
      
      // Use UTC methods consistently
      const month = date.getUTCMonth();
      const year = date.getUTCFullYear();
      const isMatch = month === currentMonth && year === currentYear;

      return isMatch;
    } catch (e) {
      console.error('[HomeScreen] Error parsing transaction date:', tx.transactionDate, e);
      return false;
    }
  });

  // Get installments that are due this month
  const monthlyInstallments: Array<{amount: string; dueDate: string}> = [];
  transactions.forEach(tx => {
    // Only process transactions that have installments (installments > 1)
    if (tx.installments > 1 && tx.installmentDetails && Array.isArray(tx.installmentDetails)) {
      tx.installmentDetails.forEach(inst => {
        try {
          const dueDate = new Date(inst.dueDate);
          const month = dueDate.getUTCMonth();
          const year = dueDate.getUTCFullYear();
          
          if (month === currentMonth && year === currentYear && inst.status === 'pending') {
            monthlyInstallments.push(inst);
          }
        } catch (e) {
          console.error('[HomeScreen] Error parsing installment date:', inst.dueDate, e);
        }
      });
    }
  });

  const monthlyTotal = monthlyTransactions.reduce(
    (sum, tx) => {
      const amount = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount || '0');
      return sum + (isNaN(amount) ? 0 : amount);
    },
    0
  ) + monthlyInstallments.reduce(
    (sum, inst) => {
      const amount = typeof inst.amount === 'string' ? parseFloat(inst.amount) : inst.amount;
      return sum + (isNaN(amount) ? 0 : amount);
    },
    0
  );

  const pendingInstallments = transactions.filter(
    (tx) => tx.status === 'pending' && tx.installments > 1
  ).length;

  const recentTransactions = transactions.slice(0, 3);

  const reserveProgress = useMemo(() => {
    if (!activeGoal.target) return 0;
    return Math.min(100, (activeGoal.current / activeGoal.target) * 100);
  }, [activeGoal.current, activeGoal.target]);

  const sixMonthSpendingData = useMemo(() => {
    const now = new Date();
    const months = Array.from({length: 6}, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString('pt-BR', {month: 'short'}).replace('.', ''),
        total: 0,
        month: date.getMonth(),
        year: date.getFullYear(),
      };
    });

    for (const tx of transactions) {
      const txDate = new Date(tx.transactionDate);
      const txMonth = txDate.getUTCMonth();
      const txYear = txDate.getUTCFullYear();
      const target = months.find(item => item.month === txMonth && item.year === txYear);

      if (!target) continue;

      const amount = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount || '0');
      if (!Number.isFinite(amount)) continue;

      if (tx.installments > 1 && Array.isArray(tx.installmentDetails)) {
        const matchingInstallments = tx.installmentDetails.filter(inst => {
          const dueDate = new Date(inst.dueDate);
          return dueDate.getUTCMonth() === txMonth && dueDate.getUTCFullYear() === txYear && inst.status === 'pending';
        });

        target.total += matchingInstallments.reduce((sum, inst) => {
          const installmentAmount = typeof inst.amount === 'string' ? parseFloat(inst.amount) : Number(inst.amount);
          return sum + (Number.isFinite(installmentAmount) ? installmentAmount : 0);
        }, 0);
        continue;
      }

      target.total += amount;
    }

    return months.map(month => ({
      x: month.label,
      y: Number(month.total.toFixed(2)),
      label: new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(month.total),
    }));
  }, [transactions]);

  const getCardColor = (brand: string) => {
    const b = brand?.toLowerCase() || '';
    if (b.includes('visa')) return '#1434CB';
    if (b.includes('mastercard')) return '#EB001B';
    if (b.includes('amex')) return '#006FCF';
    if (b.includes('elo')) return '#EF3B39';
    return '#6c5ce7';
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.appTitle}>CARTEIRA PESSOAL</Text>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Pressable
            onPress={() => navigation.navigate('CategoryReport')}
            style={{padding: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', marginRight: 8}}>
            <PieChartIcon size={18} color="#fff" />
          </Pressable>

          <Pressable
            onPress={() => setMenuVisible(true)}
            style={styles.avatarButton}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 100}}>
        
        {/* Boas-vindas */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeName}>Olá, {user?.name?.split(' ')[0]}! 👋</Text>
          <Text style={styles.welcomeSubtitle}>Veja seu resumo financeiro</Text>
        </View>

        {/* Offline sync card moved to Settings */}

        {loading ? (
          <View style={{justifyContent: 'center', alignItems: 'center', paddingTop: 40}}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <TrendingDown size={24} color="#ef4444" />
                <Text style={styles.cardTitle}>Despesas do Mês</Text>
              </View>
              <Text style={styles.amountText}>
                R$ {monthlyTotal.toFixed(2)}
              </Text>
              <Text style={styles.cardSubtitle}>
                {monthlyTransactions.length} transações{monthlyInstallments.length > 0 ? ` + ${monthlyInstallments.length} parcelas` : ''}
              </Text>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressCardHeader}>
                <View>
                  <Text style={styles.progressCardKicker}>Reserva de emergência</Text>
                  <Text style={styles.progressCardTitle}>{activeGoal.name}</Text>
                </View>
                <Text style={styles.progressCardPercent}>{reserveProgress.toFixed(0)}%</Text>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, {width: `${reserveProgress}%`}]} />
              </View>

              <View style={styles.progressMetaRow}>
                <Text style={styles.progressMetaText}>
                  {new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(activeGoal.current)} de {new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(activeGoal.target)}
                </Text>
                <Text style={styles.progressMetaText}>{activeGoal.category} • prazo {activeGoal.deadline}</Text>
              </View>
            </View>

            <View style={styles.chartSection}>
              <BarChartCard
                title="Gastos dos últimos 6 meses"
                subtitle="Visão rápida do fluxo de despesas"
                data={sixMonthSpendingData}
                xLabel="Mês"
                yLabel="Valor"
                height={320}
              />
            </View>

            {pendingInstallments > 0 && (
              <View style={styles.alertCard}>
                <AlertCircle size={20} color="#f59e0b" />
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={styles.alertTitle}>⚠️ Parcelas Pendentes</Text>
                  <Text style={styles.alertText}>
                    Você tem {pendingInstallments} compra(s) parcelada(s)
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    navigation.navigate('Transactions');
                  }}>
                  <ArrowRight size={20} color="#1f2937" />
                </Pressable>
              </View>
            )}

            {cards.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <CreditCard size={20} color="#000" />
                  <Text style={styles.sectionTitle}>Meus Cartões</Text>
                  <Pressable
                    onPress={() => navigation.navigate('Cards')}
                    style={{marginLeft: 'auto'}}>
                    <Text style={styles.seeAllText}>Ver tudo →</Text>
                  </Pressable>
                </View>

                {cards.slice(0, 2).map((card) => (
                  <Pressable
                    key={card.id}
                    onPress={() => navigation.navigate('Cards')}
                    style={[
                      styles.cardPreview,
                      {borderLeftColor: getCardColor(card.brand)},
                    ]}>
                    <View>
                      <Text style={styles.cardBrand}>{card.brand?.toUpperCase()}</Text>
                      <Text style={styles.cardNumber}>
                        •••• {card.lastFourDigits}
                      </Text>
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                      <Text style={styles.cardName}>{card.name}</Text>
                      <Text style={styles.cardExpiry}>Vence {card.expiryDate}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {recentTransactions.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <TrendingDown size={20} color="#000" />
                  <Text style={styles.sectionTitle}>Transações Recentes</Text>
                  <Pressable
                    onPress={() => navigation.navigate('Transactions')}
                    style={{marginLeft: 'auto'}}>
                    <Text style={styles.seeAllText}>Ver tudo →</Text>
                  </Pressable>
                </View>

                {recentTransactions.map((tx) => (
                  <Pressable
                    key={tx.id}
                    onPress={() => {
                      navigation.navigate('Transactions');
                    }}
                    style={styles.transactionItem}>
                    <View style={{flex: 1}}>
                      <Text style={styles.txDescription} numberOfLines={1}>
                        {tx.description}
                      </Text>
                      <Text style={styles.txCategory}>{tx.category}</Text>
                      {tx.installments > 1 && (
                        <Text style={styles.txInstallment}>
                          {tx.installmentsPaid}/{tx.installments} parcelas pagas
                        </Text>
                      )}
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                      <Text style={styles.txAmount}>
                        R$ {(typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount || '0')).toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          styles.txStatus,
                          {
                            color:
                              tx.status === 'completed'
                                ? '#10b981'
                                : '#ef4444',
                          },
                        ]}>
                        {tx.status === 'completed' ? '✓ Concluído' : '⏳ Pendente'}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.quickActions}>
              <Pressable
                style={styles.actionButton}
                onPress={() => navigation.navigate('Transactions')}>
                <Text style={styles.actionButtonText}>+ Adicionar Despesa</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, {backgroundColor: '#f3f4f6'}]}
                onPress={() => navigation.navigate('Cards')}>
                <Text
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  style={[
                    styles.actionButtonText,
                    {color: '#000'},
                  ]}>
                  Adicionar Cartão
                </Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, {backgroundColor: '#10b981'}]}
                onPress={() => navigation.navigate('CategoryReport')}>
                <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.actionButtonText, {color: '#fff'}]}>Relatório por categoria</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

        {/* Menu */}
        <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setMenuVisible(false)}>
          <Pressable 
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.menu}>
              <View style={styles.menuHeader}>
                <View style={styles.menuAvatar}>
                  <Text style={styles.menuAvatarText}>{initials}</Text>
                </View>
                <View style={styles.menuUserInfo}>
                  <Text style={styles.menuUserName}>{user?.name || 'Seu Nome'}</Text>
                  <Text style={styles.menuUserEmail}>{user?.email || 'seu@email.com'}</Text>
                </View>
              </View>

              <View style={styles.menuDivider} />

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Cards');
                }}>
                <Text style={styles.menuItemText}>Meus Cartões</Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Transactions');
                }}>
                <Text style={styles.menuItemText}>Minhas Despesas</Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Budgets');
                }}>
                <Text style={styles.menuItemText}>Orçamentos</Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Goals');
                }}>
                <Text style={styles.menuItemText}>Metas</Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Investments');
                }}>
                <Text style={styles.menuItemText}>Simulador de investimento</Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('CashFlow');
                }}>
                <Text style={styles.menuItemText}>Fluxo de caixa</Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Settings');
                }}>
                <Text style={styles.menuItemText}>Configurações</Text>
              </Pressable>

              <Pressable
                style={[styles.menuItem, styles.menuItemDanger]}
                onPress={handleLogout}>
                <Text style={styles.menuItemTextDanger}>Sair</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
