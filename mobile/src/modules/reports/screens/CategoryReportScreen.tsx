import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FlatList, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {CalendarRange, ChevronLeft, PieChart as PieChartIcon, List, TrendingUp} from 'lucide-react-native';
import {PieChartCard} from '@components/charts';
import {chartColors, chartPalette} from '@config/chartTheme';
import {listAllTransactions, type Transaction} from '@services/api/transactions';
import {listCategories, type Category} from '@services/api/categories';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'CategoryReport'>;

type PeriodKey = '1m' | '3m' | '6m' | '12m' | 'all';

type CategorySummary = {
  key: string;
  name: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
};

const PERIOD_OPTIONS: Array<{key: PeriodKey; label: string; months: number | null}> = [
  {key: '1m', label: '1 mês', months: 1},
  {key: '3m', label: '3 meses', months: 3},
  {key: '6m', label: '6 meses', months: 6},
  {key: '12m', label: '12 meses', months: 12},
  {key: 'all', label: 'Tudo', months: null},
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getPeriodLabel(period: PeriodKey) {
  return PERIOD_OPTIONS.find(option => option.key === period)?.label ?? 'Tudo';
}

function normalizeText(text: string) {
  return text.trim().toLowerCase();
}

function getPastDate(monthsBack: number | null) {
  if (monthsBack === null) {
    return null;
  }

  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  date.setMonth(date.getMonth() - (monthsBack - 1));
  return date;
}

function isValidDate(value: string) {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function fadeColor(color: string, alpha: number) {
  if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
    const normalized = color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;
    const red = Number.parseInt(normalized.slice(1, 3), 16);
    const green = Number.parseInt(normalized.slice(3, 5), 16);
    const blue = Number.parseInt(normalized.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  return color;
}

export default function CategoryReportScreen({navigation}: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('6m');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [allTransactions, allCategories] = await Promise.all([
        listAllTransactions(),
        listCategories(),
      ]);
      setTransactions(allTransactions);
      setCategories(allCategories);
    } catch (error) {
      console.error('[CategoryReportScreen] Failed to load report data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const categoryMap = useMemo(() => {
    return new Map(categories.map(category => [normalizeText(category.name), category]));
  }, [categories]);

  const filteredTransactions = useMemo(() => {
    const period = PERIOD_OPTIONS.find(option => option.key === selectedPeriod)?.months ?? null;
    const periodStart = getPastDate(period);

    return transactions.filter(transaction => {
      if (transaction.status === 'cancelled') {
        return false;
      }

      if (!isValidDate(transaction.transactionDate)) {
        return false;
      }

      if (!periodStart) {
        return true;
      }

      const transactionDate = new Date(transaction.transactionDate);
      return transactionDate >= periodStart;
    });
  }, [selectedPeriod, transactions]);

  const categorySummaries = useMemo<CategorySummary[]>(() => {
    const summaries = new Map<string, Omit<CategorySummary, 'percentage'>>();

    filteredTransactions.forEach(transaction => {
      const amount = typeof transaction.amount === 'number'
        ? transaction.amount
        : Number.parseFloat(String(transaction.amount));

      if (!Number.isFinite(amount) || amount <= 0) {
        return;
      }

      const rawName = transaction.category?.trim() || 'Sem categoria';
      const normalizedName = normalizeText(rawName);
      const knownCategory = categoryMap.get(normalizedName);
      const existing = summaries.get(normalizedName);

      if (existing) {
        existing.total += amount;
        existing.count += 1;
        return;
      }

      summaries.set(normalizedName, {
        key: normalizedName,
        name: rawName,
        color: knownCategory?.color || chartPalette[summaries.size % chartPalette.length],
        total: amount,
        count: 1,
      });
    });

    const ordered = Array.from(summaries.values()).sort((left, right) => right.total - left.total);
    const totalValue = ordered.reduce((sum, item) => sum + item.total, 0);

    return ordered.map(item => ({
      ...item,
      percentage: totalValue > 0 ? (item.total / totalValue) * 100 : 0,
    }));
  }, [categoryMap, filteredTransactions]);

  useEffect(() => {
    if (categorySummaries.length === 0) {
      setSelectedCategory(null);
      return;
    }

    if (!selectedCategory || !categorySummaries.some(item => item.key === selectedCategory)) {
      setSelectedCategory(categorySummaries[0].key);
    }
  }, [categorySummaries, selectedCategory]);

  const selectedSummary = useMemo(() => {
    return categorySummaries.find(item => item.key === selectedCategory) ?? categorySummaries[0] ?? null;
  }, [categorySummaries, selectedCategory]);

  const totalSpent = useMemo(() => {
    return categorySummaries.reduce((sum, item) => sum + item.total, 0);
  }, [categorySummaries]);

  const chartData = useMemo(() => {
    return categorySummaries.map(item => ({
      x: item.name,
      y: item.total,
      label: item.name,
      color: selectedCategory && item.key !== selectedCategory ? fadeColor(item.color, 0.28) : item.color,
    }));
  }, [categorySummaries, selectedCategory]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <ChevronLeft size={18} color={chartColors.text} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>

        <View style={styles.titleRow}>
          <View style={styles.titleIcon}>
            <PieChartIcon size={18} color={chartColors.text} />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.title}>Relatório por categoria</Text>
            <Text style={styles.subtitle}>
              Veja onde seus gastos estão concentrados e explore cada categoria por período.
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.filterCard}>
          <View style={styles.sectionHeader}>
            <CalendarRange size={16} color={chartColors.secondary} />
            <Text style={styles.sectionTitle}>Período</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodList}>
            {PERIOD_OPTIONS.map(option => {
              const active = selectedPeriod === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setSelectedPeriod(option.key)}
                  style={[styles.periodChip, active && styles.periodChipActive]}>
                  <Text style={[styles.periodChipText, active && styles.periodChipTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Gasto total</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalSpent)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Categorias</Text>
            <Text style={styles.summaryValue}>{categorySummaries.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Transações</Text>
            <Text style={styles.summaryValue}>{filteredTransactions.length}</Text>
          </View>
        </View>

        <View style={styles.chartBlock}>
          <PieChartCard
            title="Distribuição de gastos"
            subtitle={getPeriodLabel(selectedPeriod)}
            data={chartData}
            innerRadius={64}
            height={320}
          />

          {selectedSummary ? (
            <View style={styles.focusCard}>
              <View style={[styles.focusColor, {backgroundColor: selectedSummary.color}]} />
              <View style={{flex: 1}}>
                <Text style={styles.focusTitle}>{selectedSummary.name}</Text>
                <Text style={styles.focusMeta}>
                  {selectedSummary.count} transação(ões) • {selectedSummary.percentage.toFixed(1)}% do período
                </Text>
              </View>
              <Text style={styles.focusValue}>{formatCurrency(selectedSummary.total)}</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Nenhum gasto encontrado</Text>
              <Text style={styles.emptyText}>Selecione outro período para ver a composição por categoria.</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <List size={16} color={chartColors.secondary} />
          <Text style={styles.sectionTitle}>Categorias detalhadas</Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingText}>Carregando relatório...</Text>
          </View>
        ) : (
          <FlatList
            data={categorySummaries}
            keyExtractor={item => item.key}
            scrollEnabled={false}
            renderItem={({item, index}) => {
              const active = item.key === selectedCategory;
              return (
                <Pressable
                  onPress={() => setSelectedCategory(item.key)}
                  style={[styles.listItem, active && styles.listItemActive]}>
                  <View style={[styles.listColor, {backgroundColor: item.color}]} />
                  <View style={{flex: 1}}>
                    <View style={styles.listRowTop}>
                      <Text style={styles.listTitle}>{index + 1}. {item.name}</Text>
                      <Text style={styles.listValue}>{formatCurrency(item.total)}</Text>
                    </View>
                    <View style={styles.listRowBottom}>
                      <Text style={styles.listMeta}>{item.count} transação(ões)</Text>
                      <Text style={styles.listMeta}>{item.percentage.toFixed(1)}%</Text>
                    </View>
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={(
              <View style={styles.emptyListCard}>
                <Text style={styles.emptyTitle}>Sem dados para esse período</Text>
                <Text style={styles.emptyText}>Ajuste o filtro de período para visualizar o gráfico por categoria.</Text>
              </View>
            )}
          />
        )}

        <View style={styles.hintCard}>
          <TrendingUp size={16} color={chartColors.success} />
          <Text style={styles.hintText}>
            Toque em uma categoria na lista para destacar sua fatia no gráfico e comparar o peso de cada grupo.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: chartColors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  backButtonText: {
    color: chartColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46, 213, 115, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(46, 213, 115, 0.3)',
  },
  title: {
    color: chartColors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    color: chartColors.mutedText,
    fontSize: 13,
    lineHeight: 19,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  filterCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: chartColors.surface,
    borderWidth: 1,
    borderColor: chartColors.border,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: chartColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  periodList: {
    gap: 10,
    paddingRight: 4,
  },
  periodChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  periodChipActive: {
    backgroundColor: 'rgba(46, 213, 115, 0.16)',
    borderColor: 'rgba(46, 213, 115, 0.6)',
  },
  periodChipText: {
    color: chartColors.mutedText,
    fontSize: 13,
    fontWeight: '600',
  },
  periodChipTextActive: {
    color: chartColors.text,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  summaryLabel: {
    color: chartColors.mutedText,
    fontSize: 12,
    marginBottom: 8,
  },
  summaryValue: {
    color: chartColors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  chartBlock: {
    gap: 12,
  },
  focusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: chartColors.surface,
    borderWidth: 1,
    borderColor: chartColors.border,
  },
  focusColor: {
    width: 14,
    height: 14,
    borderRadius: 99,
  },
  focusTitle: {
    color: chartColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  focusMeta: {
    marginTop: 2,
    color: chartColors.mutedText,
    fontSize: 12,
  },
  focusValue: {
    color: chartColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyState: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: chartColors.surface,
    borderWidth: 1,
    borderColor: chartColors.border,
  },
  emptyListCard: {
    marginTop: 12,
    padding: 18,
    borderRadius: 18,
    backgroundColor: chartColors.surface,
    borderWidth: 1,
    borderColor: chartColors.border,
  },
  emptyTitle: {
    color: chartColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 4,
    color: chartColors.mutedText,
    fontSize: 13,
    lineHeight: 19,
  },
  loadingCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: chartColors.surface,
    borderWidth: 1,
    borderColor: chartColors.border,
  },
  loadingText: {
    color: chartColors.mutedText,
    fontSize: 13,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: chartColors.surface,
    borderWidth: 1,
    borderColor: chartColors.border,
  },
  listItemActive: {
    borderColor: 'rgba(46, 213, 115, 0.65)',
    backgroundColor: 'rgba(46, 213, 115, 0.08)',
  },
  listColor: {
    width: 14,
    height: 14,
    borderRadius: 99,
  },
  listRowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  listTitle: {
    flex: 1,
    color: chartColors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  listValue: {
    color: chartColors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  listRowBottom: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  listMeta: {
    color: chartColors.mutedText,
    fontSize: 12,
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginTop: 8,
  },
  hintText: {
    flex: 1,
    color: chartColors.text,
    fontSize: 13,
    lineHeight: 19,
  },
});