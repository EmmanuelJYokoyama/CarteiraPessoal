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
  const {activeGoal: goal, allGoals, contributions, isLoading, addContribution, setGoal, selectGoal, updateContribution, deleteContribution, deleteGoal} = useGoalsContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [showGoalSelector, setShowGoalSelector] = useState(false);
  const [editingContributionId, setEditingContributionId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalCategory, setGoalCategory] = useState('');
  const progressAnimated = useRef(new Animated.Value(0)).current;
  const {width} = useWindowDimensions();

  const hasGoal = goal.target > 0;
  const progress = useMemo(() => {
    if (!goal.target) {
      return 0;
    }
    return Math.min(100, (goal.current / goal.target) * 100);
  }, [goal.current, goal.target]);
  const columns = width >= 900 ? 3 : width >= 600 ? 2 : 1;

  // Filter contributions for active goal only
  const activeGoalContributions = contributions.filter(c => c.goalId === goal.id);

  useEffect(() => {
    Animated.timing(progressAnimated, {
      toValue: progress,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnimated]);

  const remaining = Math.max(goal.target - goal.current, 0);
  const contributionTotal = activeGoalContributions.reduce((sum, item) => sum + item.amount, 0);

  const progressColor = progress >= 100 ? '#ef4444' : progress >= 75 ? '#f59e0b' : '#2ed573';

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(value);

  function handleAddContribution() {
    if (!hasGoal) {
      return;
    }

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

  function handleEditContribution(id: string) {
    const contribution = activeGoalContributions.find(c => c.id === id);
    if (!contribution) return;

    setEditingContributionId(id);
    setAmount(String(contribution.amount));
    setNote(contribution.note);
    setShowAddModal(true);
  }

  function handleSaveContribution() {
    if (!editingContributionId) {
      handleAddContribution();
      return;
    }

    const parsedAmount = Number(amount.replace(',', '.'));
    if (!note.trim()) {
      return;
    }
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    updateContribution(editingContributionId, parsedAmount, note.trim());
    setAmount('');
    setNote('');
    setEditingContributionId(null);
    setShowAddModal(false);
  }

  function handleDeleteContribution(id: string) {
    deleteContribution(id);
  }

  function handleSaveGoal() {
    const parsedTarget = Number(goalTarget.replace(',', '.'));
    const parsedCurrent = Number((goalCurrent || '0').replace(',', '.'));

    if (!goalName.trim() || !goalCategory.trim() || !goalDeadline.trim()) {
      return;
    }

    if (Number.isNaN(parsedTarget) || parsedTarget <= 0) {
      return;
    }

    if (Number.isNaN(parsedCurrent) || parsedCurrent < 0) {
      return;
    }

    setGoal({
      name: goalName.trim(),
      target: parsedTarget,
      current: parsedCurrent,
      deadline: goalDeadline.trim(),
      category: goalCategory.trim(),
    });

    setGoalName('');
    setGoalTarget('');
    setGoalCurrent('');
    setGoalDeadline('');
    setGoalCategory('');
    setShowGoalModal(false);
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
            <Pressable style={styles.iconButton} onPress={() => setShowGoalModal(true)}>
              <Text style={{color: '#fff', fontSize: 11, fontWeight: '700'}}>META</Text>
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setShowAddModal(true)}>
              <Plus size={18} color="#fff" />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setShowConfigMenu(true)}>
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

          {!hasGoal ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Nenhuma meta definida. Toque em META para configurar.</Text>
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
            {activeGoalContributions.map((item, index) => (
              <Pressable
                key={item.id}
                style={[
                  styles.contributionCard,
                  {width: columns === 1 ? '100%' : columns === 2 ? '48%' : '31.5%'},
                  index === 0 && styles.contributionCardFeatured,
                ]}
                onLongPress={() => handleEditContribution(item.id)}>
                <View style={styles.contributionTopRow}>
                  <Text style={styles.contributionAmount}>{formatCurrency(item.amount)}</Text>
                  <Pressable
                    onPress={() => handleDeleteContribution(item.id)}
                    style={{padding: 4}}>
                    <Text style={{fontSize: 16, color: '#ff6b6b'}}>✕</Text>
                  </Pressable>
                </View>
                <Text style={styles.contributionNote} numberOfLines={2}>
                  {item.note}
                </Text>
                <Text style={styles.contributionDate}>{item.date}</Text>
              </Pressable>
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
              <Text style={styles.summaryValue}>{activeGoalContributions.slice(0, 3).length}</Text>
            </View>
          </View>
        </ScrollView>

        <Pressable style={styles.floatingActionButton} onPress={() => setShowAddModal(true)}>
          <Plus size={24} color="#000" />
        </Pressable>
      </View>

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => {
        setShowAddModal(false);
        setAmount('');
        setNote('');
        setEditingContributionId(null);
      }}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingContributionId ? 'Editar aporte' : 'Novo aporte'}</Text>
            <Text style={styles.modalSubtitle}>
              {editingContributionId ? 'Atualize os dados do aporte.' : 'Adicione um valor ao histórico da meta.'}
            </Text>

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
              <Pressable style={styles.secondaryButton} onPress={() => {
                setShowAddModal(false);
                setAmount('');
                setNote('');
                setEditingContributionId(null);
              }}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleSaveContribution}>
                <Text style={styles.primaryButtonText}>{editingContributionId ? 'Salvar' : 'Adicionar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showGoalModal} transparent animationType="fade" onRequestClose={() => setShowGoalModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Definir meta</Text>
            <Text style={styles.modalSubtitle}>Preencha os dados da sua meta financeira.</Text>

            <Text style={styles.inputLabel}>Nome da meta</Text>
            <TextInput
              value={goalName}
              onChangeText={setGoalName}
              placeholder="Ex: Reserva de emergência"
              placeholderTextColor="#666"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Categoria</Text>
            <TextInput
              value={goalCategory}
              onChangeText={setGoalCategory}
              placeholder="Ex: Poupança"
              placeholderTextColor="#666"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Prazo</Text>
            <TextInput
              value={goalDeadline}
              onChangeText={setGoalDeadline}
              placeholder="Ex: 30/12/2026"
              placeholderTextColor="#666"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Valor da meta</Text>
            <TextInput
              value={goalTarget}
              onChangeText={setGoalTarget}
              placeholder="0,00"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Valor atual (opcional)</Text>
            <TextInput
              value={goalCurrent}
              onChangeText={setGoalCurrent}
              placeholder="0,00"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setShowGoalModal(false)}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleSaveGoal}>
                <Text style={styles.primaryButtonText}>Salvar meta</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showConfigMenu} transparent animationType="fade" onRequestClose={() => setShowConfigMenu(false)}>
        <Pressable
          style={{flex: 1}}
          onPress={() => setShowConfigMenu(false)}>
          <View style={{flex: 1, justifyContent: 'flex-start', paddingTop: 80, alignItems: 'flex-end', paddingRight: 16}}>
            <View style={{backgroundColor: '#1a1a1a', borderRadius: 8, overflow: 'hidden', minWidth: 180, borderWidth: 1, borderColor: '#333'}}>
              {allGoals.length > 0 && (
                <Pressable
                  style={{paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#333'}}
                  onPress={() => {
                    setShowGoalSelector(true);
                    setShowConfigMenu(false);
                  }}>
                  <Text style={{color: '#2ed573', fontSize: 14, fontWeight: '500'}}>Mudar meta</Text>
                </Pressable>
              )}
              <Pressable
                style={{paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#333'}}
                onPress={() => {
                  if (hasGoal) {
                    setGoalName(goal.name);
                    setGoalTarget(String(goal.target));
                    setGoalCurrent(String(goal.current));
                    setGoalDeadline(goal.deadline);
                    setGoalCategory(goal.category);
                    setShowGoalModal(true);
                    setShowConfigMenu(false);
                  }
                }}>
                <Text style={{color: '#fff', fontSize: 14, fontWeight: '500'}}>Editar meta</Text>
              </Pressable>
              <Pressable
                style={{paddingVertical: 12, paddingHorizontal: 16}}
                onPress={() => {
                  deleteGoal(goal.id);
                  setShowConfigMenu(false);
                }}>
                <Text style={{color: '#ff6b6b', fontSize: 14, fontWeight: '500'}}>Deletar meta</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showGoalSelector} transparent animationType="fade" onRequestClose={() => setShowGoalSelector(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecionar meta</Text>
            <Text style={styles.modalSubtitle}>Escolha qual meta deseja acompanhar.</Text>

            <ScrollView style={{maxHeight: 300}} showsVerticalScrollIndicator={false}>
              {allGoals.map((g) => (
                <Pressable
                  key={g.id}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: g.id === goal.id ? 'rgba(46, 213, 115, 0.2)' : 'transparent',
                    borderBottomWidth: 1,
                    borderBottomColor: '#333',
                  }}
                  onPress={() => {
                    selectGoal(g.id);
                    setShowGoalSelector(false);
                  }}>
                  <View style={{marginBottom: 4}}>
                    <Text style={{color: '#fff', fontWeight: '600', fontSize: 14}}>
                      {g.name}
                      {g.id === goal.id && ' ✓'}
                    </Text>
                  </View>
                  <Text style={{color: '#999', fontSize: 12}}>
                    {g.current.toFixed(2)} de {g.target.toFixed(2)} • {g.category}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setShowGoalSelector(false)}>
                <Text style={styles.secondaryButtonText}>Fechar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
