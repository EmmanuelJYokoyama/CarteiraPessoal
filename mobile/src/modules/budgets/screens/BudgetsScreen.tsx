import React, {useState, useCallback} from 'react';
import {View, Text, FlatList, Pressable, ActivityIndicator, Modal} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {Plus} from 'lucide-react-native';
import {listBudgets, getBudgetProgress, type Budget, type BudgetProgress} from '@services/api/budgets';
import {BudgetForm} from '../components/BudgetForm';

export default function BudgetsScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetProgressMap, setBudgetProgressMap] = useState<Record<string, BudgetProgress>>({});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadBudgets();
    }, []),
  );

  async function loadBudgets() {
    try {
      setLoading(true);
      const data = await listBudgets();
      setBudgets(data);

      // Load progress for each budget
      const progressMap: Record<string, BudgetProgress> = {};
      for (const budget of data) {
        try {
          const progress = await getBudgetProgress(budget.id);
          progressMap[budget.id] = progress;
        } catch (error) {
          console.error(`Erro ao carregar progresso do orçamento ${budget.id}:`, error);
        }
      }
      setBudgetProgressMap(progressMap);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCreateNew() {
    setSelectedBudget(null);
    setShowForm(true);
  }

  function handleEditBudget(budget: Budget) {
    setSelectedBudget(budget);
    setShowForm(true);
  }

  function handleFormSuccess() {
    setShowForm(false);
    loadBudgets();
  }

  function getProgressColor(percent: number): string {
    if (percent >= 100) return '#ff6b6b';
    if (percent >= 80) return '#ffa94d';
    return '#2ed573';
  }

  const formatCurrency = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#0a0a0a'}}>
      <View style={{flex: 1}}>
        <View style={{padding: 16, borderBottomWidth: 1, borderBottomColor: '#333'}}>
          <Text style={{fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 12}}>Orçamentos</Text>
          <Pressable
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: '#2ed573',
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onPress={handleCreateNew}>
            <Plus size={20} color="#000" />
            <Text style={{color: '#000', textAlign: 'center', fontWeight: '600', fontSize: 16}}>Novo Orçamento</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size="large" color="#2ed573" />
          </View>
        ) : budgets.length === 0 ? (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16}}>
            <Text style={{color: '#999', fontSize: 16, textAlign: 'center'}}>
              Nenhum orçamento criado ainda. Toque em "Novo Orçamento" para começar.
            </Text>
          </View>
        ) : (
          <FlatList
            data={budgets}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{padding: 16}}
            renderItem={({item}) => {
              const progress = budgetProgressMap[item.id];
              const progressColor = getProgressColor(progress?.percent || 0);

              return (
                <Pressable
                  onPress={() => handleEditBudget(item)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderColor: '#333',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                  }}>
                  <View style={{marginBottom: 12}}>
                    <Text style={{fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4}}>
                      {item.name}
                    </Text>
                    {item.category && (
                      <Text style={{fontSize: 12, color: '#999'}}>
                        Categoria: <Text style={{color: '#ccc'}}>{item.category}</Text>
                      </Text>
                    )}
                    <Text style={{fontSize: 12, color: '#999', marginTop: 4}}>
                      {formatDate(item.periodStart)} até {formatDate(item.periodEnd)}
                    </Text>
                  </View>

                  {progress && (
                    <View>
                      <View style={{marginBottom: 8}}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6}}>
                          <Text style={{color: '#999', fontSize: 12}}>
                            {formatCurrency(progress.totalSpent)} de {formatCurrency(progress.limit)}
                          </Text>
                          <Text style={{color: progressColor, fontWeight: '700', fontSize: 12}}>
                            {progress.percent}%
                          </Text>
                        </View>

                        <View
                          style={{
                            height: 8,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: 4,
                            overflow: 'hidden',
                          }}>
                          <View
                            style={{
                              height: '100%',
                              width: `${Math.min(progress.percent, 100)}%`,
                              backgroundColor: progressColor,
                            }}
                          />
                        </View>
                      </View>

                      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                        <Text style={{color: '#999', fontSize: 11}}>
                          Restante: {formatCurrency(progress.remaining)}
                        </Text>
                        <Text
                          style={{
                            color: progress.percent >= 100 ? '#ff6b6b' : '#2ed573',
                            fontSize: 11,
                            fontWeight: '600',
                          }}>
                          {progress.percent >= 100 ? '⚠ Limite atingido' : '✓ Dentro do limite'}
                        </Text>
                      </View>
                    </View>
                  )}
                </Pressable>
              );
            }}
          />
        )}
      </View>

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View style={{flex: 1, backgroundColor: '#0a0a0a'}}>
          <View style={{padding: 16, borderBottomWidth: 1, borderBottomColor: '#333', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <Text style={{fontSize: 18, fontWeight: '700', color: '#fff'}}>
              {selectedBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
            </Text>
            <Pressable onPress={() => setShowForm(false)}>
              <Text style={{color: '#999', fontSize: 24}}>✕</Text>
            </Pressable>
          </View>
          <BudgetForm
            budgetId={selectedBudget?.id}
            initialData={selectedBudget}
            onSuccess={handleFormSuccess}
            onClose={() => setShowForm(false)}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}
