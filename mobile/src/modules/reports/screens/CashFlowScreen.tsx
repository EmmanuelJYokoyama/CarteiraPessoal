import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {View, Text, ScrollView, Pressable, StyleSheet} from 'react-native';
import {ChevronLeft, BarChart as BarIcon} from 'lucide-react-native';
import {GroupedBarCard} from '@components/charts/GroupedBarCard';
import {LineChartCard} from '@components/charts/LineChartCard';
import {listAllTransactions, type Transaction} from '@services/api/transactions';
import {chartColors} from '@config/chartTheme';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'CashFlow'>;

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(v);
}

const INCOME_KEYWORDS = ['salario','salário','receita','entrada','deposito','depósito','transfer'];

export default function CashFlowScreen({navigation}: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const all = await listAllTransactions();
      setTransactions(all);
    } catch (err) {
      console.error('[CashFlow] failed to load', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const months = useMemo(() => {
    const now = new Date();
    const arr = [] as {label: string; month: number; year: number}[];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push({label: d.toLocaleDateString('pt-BR', {month: 'short', year: 'numeric'}).replace('.', ''), month: d.getUTCMonth(), year: d.getUTCFullYear()});
    }
    return arr;
  }, []);

  const series = useMemo(() => {
    // Prepare per-month totals
    const data = months.map(m => ({x: m.label, income: 0, expense: 0}));

    for (const tx of transactions) {
      try {
        const date = new Date(tx.transactionDate);
        const txMonth = date.getUTCMonth();
        const txYear = date.getUTCFullYear();
        const idx = months.findIndex(m => m.month === txMonth && m.year === txYear);
        if (idx === -1) continue;

        const amount = typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount || '0'));
        if (!Number.isFinite(amount)) continue;

        const cat = (tx.category || '').toLowerCase();
        const desc = (tx.description || '').toLowerCase();
        const isIncome = INCOME_KEYWORDS.some(k => cat.includes(k) || desc.includes(k));

        if (isIncome) data[idx].income += amount;
        else data[idx].expense += amount;
      } catch (e) {
        // ignore parse errors
      }
    }

    return data;
  }, [months, transactions]);

  const cumulative = useMemo(() => {
    const result: {x: string; y: number; label?: string}[] = [];
    let acc = 0;
    for (const m of series) {
      acc += (m.income - m.expense);
      result.push({x: m.x, y: Number(acc.toFixed(2)), label: formatCurrency(acc)});
    }
    return result;
  }, [series]);

  const currentBalance = cumulative[cumulative.length - 1]?.y ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={18} color={chartColors.text} />
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Fluxo de caixa</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo acumulado</Text>
          <Text style={styles.balanceValue}>{formatCurrency(currentBalance)}</Text>
          <Text style={styles.balanceHint}>Variação nos últimos 12 meses</Text>
        </View>

        <GroupedBarCard title="Entradas x Saídas (12 meses)" subtitle="Mensal" data={series} height={320} />

        <View style={{marginTop: 12}}>
          <LineChartCard title="Saldo acumulado" subtitle="Evolução" data={cumulative} height={180} showDots={false} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: chartColors.background},
  header: {paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12},
  backButton: {flexDirection: 'row', alignItems: 'center', gap: 8},
  backText: {color: chartColors.text, fontWeight: '700'},
  title: {flex: 1, fontSize: 20, fontWeight: '800', color: chartColors.text},
  content: {padding: 16, gap: 12},
  balanceCard: {backgroundColor: chartColors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: chartColors.border},
  balanceLabel: {color: chartColors.mutedText, fontSize: 12, marginBottom: 6},
  balanceValue: {color: chartColors.text, fontSize: 28, fontWeight: '900'},
  balanceHint: {color: chartColors.mutedText, marginTop: 8, fontSize: 12},
});
