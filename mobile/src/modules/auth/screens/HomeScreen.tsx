import React, {useState, useCallback} from 'react';
import {View, Text, Pressable, Modal, ScrollView, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '@contexts/AuthContext';
import {listTransactions, type Transaction} from '@services/api/transactions';
import {listCards, type Card} from '@services/api/cards';
import {TrendingDown, CreditCard, AlertCircle, ArrowRight} from 'lucide-react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {styles} from './styles/HomeScreen.styles';

type Props = NativeStackScreenProps<any, 'Home'>;

export default function HomeScreen({navigation}: Props) {
  const {signOut, user} = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const initials = user?.name?.charAt(0)?.toUpperCase() || '👤';

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, []),
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [txs, cardsData] = await Promise.all([
        listTransactions(),
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

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter(tx => {
    const date = new Date(tx.transactionDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const monthlyTotal = monthlyTransactions.reduce(
    (sum, tx) => sum + parseFloat(tx.amount),
    0
  );

  const pendingInstallments = transactions.filter(
    (tx) => tx.status === 'pending' && tx.installments > 1
  ).length;

  const recentTransactions = transactions.slice(0, 3);

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

        <Pressable
          onPress={() => setMenuVisible(true)}
          style={styles.avatarButton}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </Pressable>
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
                {monthlyTransactions.length} transações
              </Text>
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
                        R$ {parseFloat(tx.amount).toFixed(2)}
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
                  style={[
                    styles.actionButtonText,
                    {color: '#000'},
                  ]}>
                  Adicionar Cartão
                </Text>
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
          onPress={() => setMenuVisible(false)}
          activeOpacity={1}>
          <Pressable 
            onPress={(e) => e.stopPropagation()}
            activeOpacity={1}>
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
