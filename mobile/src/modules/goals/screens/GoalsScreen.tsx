import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MoreHorizontal, Plus} from 'lucide-react-native';
import {Icon} from '@components/common/Icon';
import {useGoalsContext} from '@contexts/GoalsContext';
import {styles} from './styles/GoalsScreen.styles';

export default function GoalsScreen() {
  const {activeGoal: goal, contributions, isLoading, addContribution} = useGoalsContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const progressAnimated = useRef(new Animated.Value(0)).current;
  const {width} = useWindowDimensions();

  const progress = useMemo(() => Math.min(100, (goal.current / goal.target) * 100), [goal.current, goal.target]);
  const columns = width >= 900 ? 3 : width >= 600 ? 2 : 1;

  useEffect(() => {
    Animated.timing(progressAnimated, {
      toValue: progress,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnimated]);

  const remaining = Math.max(goal.target - goal.current, 0);
  const contributionTotal = contributions.reduce((sum, item) => sum + item.amount, 0);

  const progressColor = progress >= 100 ? '#ef4444' : progress >= 75 ? '#f59e0b' : '#2ed573';

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(value);

  function handleAddContribution() {
    const parsedAmount = Number(amount.replace(',', '.'));
    if (!note.trim()) {
      return;
    }
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    addContribution(parsedAmount, note.trim());
    setAmount('');
    setNote('');
    setShowAddModal(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.kicker}>Objetivo financeiro</Text>
            <Text style={styles.title}>Tela de metas com barra de progresso</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable style={styles.iconButton} onPress={() => setShowAddModal(true)}>
              <Plus size={18} color="#fff" />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <MoreHorizontal size={18} color="#fff" />
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {isLoading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Carregando metas e aportes...</Text>
            </View>
          ) : null}
          <View style={styles.heroCard}>
            <View style={styles.heroCardTopRow}>
              <View>
                <Text style={styles.goalLabel}>Meta ativa</Text>
                <Text style={styles.goalName}>{goal.name}</Text>
              </View>
              <View style={styles.goalBadge}>
                <Text style={styles.goalBadgeText}>{goal.category}</Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Atual</Text>
                <Text style={styles.metricValue}>{formatCurrency(goal.current)}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Meta</Text>
                <Text style={styles.metricValue}>{formatCurrency(goal.target)}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Restante</Text>
                <Text style={styles.metricValue}>{formatCurrency(remaining)}</Text>
              </View>
            </View>

            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressLabel}>Progresso da meta</Text>
              <Text style={[styles.progressPercent, {color: progressColor}]}>{progress.toFixed(0)}%</Text>
            </View>

            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnimated.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: progressColor,
                  },
                ]}
              />
            </View>

            <View style={styles.goalFooterRow}>
              <View>
                <Text style={styles.footerLabel}>Prazo</Text>
                <Text style={styles.footerValue}>{goal.deadline}</Text>
              </View>
              <View style={styles.footerPill}>
                <Icon name="check" size={14} color="#2ed573" />
                <Text style={styles.footerPillText}>
                  {progress >= 100 ? 'Meta atingida' : 'Em andamento'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Histórico de aportes</Text>
            <Text style={styles.sectionSubtitle}>{contributionTotal.toFixed(0)} total em {contributions.length} aportes</Text>
          </View>

          <View style={styles.gridWrap}>
            {contributions.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.contributionCard,
                  {width: columns === 1 ? '100%' : columns === 2 ? '48%' : '31.5%'},
                  index === 0 && styles.contributionCardFeatured,
                ]}>
                <View style={styles.contributionTopRow}>
                  <Text style={styles.contributionAmount}>{formatCurrency(item.amount)}</Text>
                  <View style={styles.contributionDot} />
                </View>
                <Text style={styles.contributionNote} numberOfLines={2}>
                  {item.note}
                </Text>
                <Text style={styles.contributionDate}>{item.date}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Resumo</Text>
            <Text style={styles.sectionSubtitle}>Atualização visual da meta</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Meta principal</Text>
              <Text style={styles.summaryValue}>{goal.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Avanço</Text>
              <Text style={styles.summaryValue}>{progress.toFixed(0)}%</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Aportes recentes</Text>
              <Text style={styles.summaryValue}>{contributions.slice(0, 3).length}</Text>
            </View>
          </View>
        </ScrollView>

        <Pressable style={styles.floatingActionButton} onPress={() => setShowAddModal(true)}>
          <Plus size={24} color="#000" />
        </Pressable>
      </View>

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Novo aporte</Text>
            <Text style={styles.modalSubtitle}>Adicione um valor ao histórico da meta.</Text>

            <Text style={styles.inputLabel}>Valor</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0,00"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Observação</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Ex: salário, extra, venda"
              placeholderTextColor="#666"
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setShowAddModal(false)}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleAddContribution}>
                <Text style={styles.primaryButtonText}>Adicionar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
