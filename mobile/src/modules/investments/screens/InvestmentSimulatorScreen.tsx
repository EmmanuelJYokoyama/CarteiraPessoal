import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Calculator, TrendingUp} from 'lucide-react-native';
import {useGoalsContext} from '@contexts/GoalsContext';
import {styles} from './styles/InvestmentSimulatorScreen.styles';

const DEFAULT_RATE = '1,2';
const DEFAULT_MONTHS = '12';

export default function InvestmentSimulatorScreen() {
  const {activeGoal, contributions, isLoading} = useGoalsContext();
  const [principal, setPrincipal] = useState(String(activeGoal.current));
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [months, setMonths] = useState(DEFAULT_MONTHS);
  const [showDetails, setShowDetails] = useState(true);

  React.useEffect(() => {
    setPrincipal(String(activeGoal.current));
  }, [activeGoal.current]);

  const result = useMemo(() => {
    const parsedPrincipal = Number(principal.replace(',', '.'));
    const parsedRate = Number(rate.replace(',', '.'));
    const parsedMonths = Number(months.replace(',', '.'));

    const safePrincipal = Number.isFinite(parsedPrincipal) && parsedPrincipal > 0 ? parsedPrincipal : 0;
    const safeRate = Number.isFinite(parsedRate) && parsedRate >= 0 ? parsedRate : 0;
    const safeMonths = Number.isFinite(parsedMonths) && parsedMonths > 0 ? Math.floor(parsedMonths) : 0;
    const monthlyRate = safeRate / 100;

    const finalValue = safePrincipal * Math.pow(1 + monthlyRate, safeMonths);
    const gain = finalValue - safePrincipal;
    const totalInvested = safePrincipal;

    return {
      principal: safePrincipal,
      rate: safeRate,
      months: safeMonths,
      monthlyRate,
      finalValue,
      gain,
      totalInvested,
      isValid: safePrincipal > 0 && safeMonths > 0,
    };
  }, [months, principal, rate]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(value);

  const formatPercent = (value: number) =>
    new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value);

  const contributionsTotal = contributions.reduce((sum, item) => sum + item.amount, 0);
  const visibleContributions = contributions.slice(0, 6);
  const reserveProgress = Math.min(100, (activeGoal.current / activeGoal.target) * 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.heroBackgroundTop} />
        <View style={styles.heroBackgroundBottom} />

        <View style={styles.header}>
          <View style={styles.headerIconWrap}>
            <Calculator size={22} color="#0a0a0a" />
          </View>
          <View style={styles.headerTextBlock}>
            <Text style={styles.kicker}>Simulação de investimento</Text>
            <Text style={styles.title}>Projete o crescimento do seu dinheiro</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.goalContextCard}>
            <Text style={styles.sectionLabel}>Reserva de emergência</Text>
            <Text style={styles.goalContextTitle}>{activeGoal.name}</Text>
            <Text style={styles.goalContextSubtitle}>
              {activeGoal.category} • prazo {activeGoal.deadline}
            </Text>

            <View style={styles.goalContextMetricsRow}>
              <View style={styles.goalContextMetric}>
                <Text style={styles.metricLabel}>Atual</Text>
                <Text style={styles.metricValue}>{formatCurrency(activeGoal.current)}</Text>
              </View>
              <View style={styles.goalContextMetric}>
                <Text style={styles.metricLabel}>Meta</Text>
                <Text style={styles.metricValue}>{formatCurrency(activeGoal.target)}</Text>
              </View>
            </View>

            <View style={styles.goalContextProgressHeader}>
              <Text style={styles.progressLabel}>Progresso da reserva</Text>
              <Text style={styles.progressValue}>{reserveProgress.toFixed(0)}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {width: `${reserveProgress}%`}]} />
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionLabel}>Entradas</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Aporte inicial</Text>
              <TextInput
                value={principal}
                onChangeText={setPrincipal}
                keyboardType="decimal-pad"
                placeholder="0,00"
                placeholderTextColor="#6b7280"
                style={styles.input}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>Taxa ao mês (%)</Text>
                <TextInput
                  value={rate}
                  onChangeText={setRate}
                  keyboardType="decimal-pad"
                  placeholder="1,20"
                  placeholderTextColor="#6b7280"
                  style={styles.input}
                />
              </View>

              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>Prazo (meses)</Text>
                <TextInput
                  value={months}
                  onChangeText={setMonths}
                  keyboardType="number-pad"
                  placeholder="12"
                  placeholderTextColor="#6b7280"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.formHintRow}>
              <Text style={styles.formHint}>
                Fórmula: M = C × (1 + i)^n{isLoading ? ' • carregando histórico...' : ''}
              </Text>
              <Pressable style={styles.detailToggle} onPress={() => setShowDetails(current => !current)}>
                <Text style={styles.detailToggleText}>{showDetails ? 'Ocultar detalhes' : 'Exibir detalhes'}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.resultCard}>
            <View style={styles.resultTopRow}>
              <View>
                <Text style={styles.resultLabel}>Projeção final</Text>
                <Text style={styles.resultValue}>{formatCurrency(result.finalValue)}</Text>
              </View>
              <View style={styles.resultBadge}>
                <TrendingUp size={16} color="#2ed573" />
                <Text style={styles.resultBadgeText}>Rentabilidade</Text>
              </View>
            </View>

            <View style={styles.resultMetricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Capital inicial</Text>
                <Text style={styles.metricValue}>{formatCurrency(activeGoal.current)}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Rendimento</Text>
                <Text style={styles.metricValue}>{formatCurrency(result.gain)}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Taxa mensal</Text>
                <Text style={styles.metricValue}>{formatPercent(result.rate)}%</Text>
              </View>
            </View>

            <View style={styles.progressBlock}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Prazo informado</Text>
                <Text style={styles.progressValue}>{result.months} meses</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {width: `${Math.min(100, result.months > 0 ? 100 : 0)}%`},
                  ]}
                />
              </View>
            </View>
          </View>

          {showDetails && (
            <View style={styles.detailsCard}>
              <Text style={styles.sectionLabel}>Detalhamento</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Montante final</Text>
                <Text style={styles.detailValue}>{formatCurrency(result.finalValue)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Total investido</Text>
                <Text style={styles.detailValue}>{formatCurrency(result.totalInvested)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Ganho líquido</Text>
                <Text style={styles.detailValuePositive}>{formatCurrency(result.gain)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Taxa aplicada</Text>
                <Text style={styles.detailValue}>{formatPercent(result.rate)}% ao mês</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Períodos simulados</Text>
                <Text style={styles.detailValue}>{result.months} meses</Text>
              </View>
            </View>
          )}

          <View style={styles.timelineCard}>
            <Text style={styles.sectionLabel}>Histórico de aportes</Text>
            <Text style={styles.timelineSummary}>
              {formatCurrency(contributionsTotal)} distribuídos em {contributions.length} aportes
            </Text>
            <View style={styles.timelineList}>
              {visibleContributions.length > 0 ? (
                visibleContributions.map(item => (
                  <View key={item.id} style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineTextBlock}>
                      <Text style={styles.timelineTitle}>{item.note}</Text>
                      <Text style={styles.timelineSubtitle}>{item.date} • {formatCurrency(item.amount)}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyStateText}>Sem aportes cadastrados ainda.</Text>
              )}
            </View>
          </View>

          {!result.isValid && (
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>Informe um aporte inicial maior que zero e um prazo em meses para calcular.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
