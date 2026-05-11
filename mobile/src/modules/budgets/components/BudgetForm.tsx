import React, {useState} from 'react';
import {View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Modal, FlatList, Alert, Switch} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useCategories} from '@modules/transactions/hooks/useCategories';
import {listCards, type Card} from '@services/api/cards';
import {useBudgetForm} from '../hooks/useBudgetForm';

interface BudgetFormProps {
  budgetId?: string;
  initialData?: any;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function BudgetForm({budgetId, initialData, onSuccess, onClose}: BudgetFormProps) {
  const {categories, addCategory} = useCategories();
  const [cards, setCards] = React.useState<Card[]>([]);
  const [showDatePickerStart, setShowDatePickerStart] = useState(false);
  const [showDatePickerEnd, setShowDatePickerEnd] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#2ED573');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const {
    name,
    setName,
    amount,
    setAmount,
    selectedCategory,
    setSelectedCategory,
    selectedCard,
    setSelectedCard,
    periodStart,
    setPeriodStart,
    periodEnd,
    setPeriodEnd,
    periodType,
    setPeriodType,
    isLoading,
    errorMessage,
    handleSave,
    handleDelete,
  } = useBudgetForm(budgetId, initialData, onSuccess, onClose);

  React.useEffect(() => {
    loadCards();
  }, []);

  async function loadCards() {
    try {
      const data = await listCards();
      setCards(data);
    } catch (error) {
      console.error('Erro ao carregar cartões:', error);
    }
  }

  async function handleCreateNewCategory() {
    if (!newCategoryName.trim()) {
      Alert.alert('Erro', 'Nome da categoria obrigatório');
      return;
    }

    try {
      setCreatingCategory(true);
      const newCategory = await addCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
      });
      setSelectedCategory(newCategory.name);
      setNewCategoryName('');
      setNewCategoryColor('#2ED573');
      setShowNewCategoryInput(false);
      Alert.alert('Sucesso', 'Categoria criada com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao criar categoria');
      console.error('Erro ao criar categoria:', error);
    } finally {
      setCreatingCategory(false);
    }
  }

  function handleDateChangeStart(_event: any, selectedDate?: Date) {
    if (selectedDate) {
      setPeriodStart(selectedDate);
    }
    setShowDatePickerStart(false);
  }

  function handleDateChangeEnd(_event: any, selectedDate?: Date) {
    if (selectedDate) {
      setPeriodEnd(selectedDate);
    }
    setShowDatePickerEnd(false);
  }

  function setMonthlyPeriod() {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);

    setPeriodStart(start);
    setPeriodEnd(end);
  }

  const formatCurrency = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <View style={{flex: 1, backgroundColor: '#0a0a0a'}}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 16}}>
        {errorMessage ? (
          <View style={{backgroundColor: 'rgba(255, 0, 0, 0.2)', padding: 12, borderRadius: 6, marginBottom: 16}}>
            <Text style={{color: '#ff6b6b', fontSize: 14}}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={{marginBottom: 20}}>
          <Text style={{fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12}}>
            {budgetId ? 'Editar Orçamento' : 'Novo Orçamento'}
          </Text>

          <View style={{marginBottom: 16}}>
            <Text style={{fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 8}}>Nome</Text>
            <TextInput
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: '#333',
                borderRadius: 8,
                color: '#fff',
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 14,
              }}
              placeholder="Ex: Alimentação, Lazer"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
              editable={!isLoading}
            />
          </View>

          <View style={{marginBottom: 16}}>
            <Text style={{fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 8}}>Valor Limite</Text>
            <TextInput
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: '#333',
                borderRadius: 8,
                color: '#fff',
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 14,
              }}
              placeholder="0.00"
              placeholderTextColor="#666"
              value={amount}
              onChangeText={text => setAmount(text.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              editable={!isLoading}
            />
          </View>

          <View style={{marginBottom: 16}}>
            <Text style={{fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 8}}>Categoria (Opcional)</Text>
            <Pressable
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: '#333',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
              }}
              onPress={() => setShowCategoryPicker(true)}>
              <Text style={{color: selectedCategory ? '#fff' : '#666', fontSize: 14}}>
                {selectedCategory || 'Selecione uma categoria'}
              </Text>
            </Pressable>
          </View>

          <View style={{marginBottom: 16}}>
            <Text style={{fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 8}}>Cartão (Opcional)</Text>
            <Pressable
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: '#333',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
              }}
              onPress={() => setShowCardPicker(true)}>
              <Text style={{color: selectedCard ? '#fff' : '#666', fontSize: 14}}>
                {selectedCard ? `Cartão selecionado` : 'Selecione um cartão (opcional)'}
              </Text>
            </Pressable>
          </View>

          <View style={{marginBottom: 16}}>
            <Text style={{fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 8}}>Período</Text>
            <View style={{flexDirection: 'row', gap: 8, marginBottom: 12}}>
              <Pressable
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: periodType === 'monthly' ? '#2ed573' : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: periodType === 'monthly' ? '#2ed573' : '#333',
                }}
                onPress={() => {
                  setPeriodType('monthly');
                  setMonthlyPeriod();
                }}>
                <Text style={{color: periodType === 'monthly' ? '#000' : '#fff', textAlign: 'center', fontWeight: '600'}}>
                  Mensal
                </Text>
              </Pressable>
              <Pressable
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: periodType === 'custom' ? '#2ed573' : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: periodType === 'custom' ? '#2ed573' : '#333',
                }}
                onPress={() => setPeriodType('custom')}>
                <Text style={{color: periodType === 'custom' ? '#000' : '#fff', textAlign: 'center', fontWeight: '600'}}>
                  Customizado
                </Text>
              </Pressable>
            </View>

            {periodType === 'custom' && (
              <View style={{gap: 12}}>
                <View>
                  <Text style={{fontSize: 11, color: '#999', marginBottom: 4}}>Data Inicial</Text>
                  <Pressable
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderWidth: 1,
                      borderColor: '#333',
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                    onPress={() => setShowDatePickerStart(true)}>
                    <Text style={{color: '#fff', fontSize: 14}}>{formatDate(periodStart)}</Text>
                  </Pressable>
                </View>

                <View>
                  <Text style={{fontSize: 11, color: '#999', marginBottom: 4}}>Data Final</Text>
                  <Pressable
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderWidth: 1,
                      borderColor: '#333',
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                    onPress={() => setShowDatePickerEnd(true)}>
                    <Text style={{color: '#fff', fontSize: 14}}>{formatDate(periodEnd)}</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          <View style={{gap: 10}}>
            <Pressable
              style={{
                paddingVertical: 14,
                paddingHorizontal: 16,
                backgroundColor: '#2ed573',
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={handleSave}
              disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#000" /> : <Text style={{color: '#000', fontWeight: '700'}}>Salvar</Text>}
            </Pressable>

            {budgetId && (
              <Pressable
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  backgroundColor: 'rgba(255, 0, 0, 0.2)',
                  borderRadius: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#ff6b6b',
                }}
                onPress={handleDelete}
                disabled={isLoading}>
                <Text style={{color: '#ff6b6b', fontWeight: '700'}}>Deletar</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={showDatePickerStart} transparent animationType="fade">
        <View style={{flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)'}}>
          <View style={{backgroundColor: '#1a1a1a', margin: 40, borderRadius: 8, padding: 16}}>
            <DateTimePicker
              value={periodStart}
              mode="date"
              display="spinner"
              onChange={handleDateChangeStart}
              textColor="#fff"
            />
            <Pressable
              style={{
                marginTop: 16,
                backgroundColor: '#2ed573',
                padding: 12,
                borderRadius: 6,
                alignItems: 'center',
              }}
              onPress={() => setShowDatePickerStart(false)}>
              <Text style={{color: '#000', fontWeight: '600'}}>Confirmar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showDatePickerEnd} transparent animationType="fade">
        <View style={{flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)'}}>
          <View style={{backgroundColor: '#1a1a1a', margin: 40, borderRadius: 8, padding: 16}}>
            <DateTimePicker
              value={periodEnd}
              mode="date"
              display="spinner"
              onChange={handleDateChangeEnd}
              textColor="#fff"
            />
            <Pressable
              style={{
                marginTop: 16,
                backgroundColor: '#2ed573',
                padding: 12,
                borderRadius: 6,
                alignItems: 'center',
              }}
              onPress={() => setShowDatePickerEnd(false)}>
              <Text style={{color: '#000', fontWeight: '600'}}>Confirmar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showCategoryPicker} transparent animationType="slide">
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end'}}>
          <View style={{backgroundColor: '#1a1a1a', borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: '80%'}}>
            <View style={{padding: 16, borderBottomWidth: 1, borderBottomColor: '#333', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Text style={{color: '#fff', fontSize: 18, fontWeight: '700'}}>Selecionar Categoria</Text>
              <Pressable onPress={() => setShowCategoryPicker(false)}>
                <Text style={{color: '#999', fontSize: 24}}>×</Text>
              </Pressable>
            </View>

            {!showNewCategoryInput ? (
              <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => (
                  <Pressable
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: '#2a2a2a',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onPress={() => {
                      setSelectedCategory(item.name);
                      setShowCategoryPicker(false);
                    }}>
                    <View style={{flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12}}>
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: item.color,
                        }}
                      />
                      <Text style={{color: '#fff', fontSize: 16, fontWeight: '500'}}>
                        {item.name}
                      </Text>
                    </View>
                    {selectedCategory === item.name && (
                      <Text style={{color: '#2ed573', fontSize: 18, fontWeight: '700'}}>✓</Text>
                    )}
                  </Pressable>
                )}
                ListFooterComponent={
                  <Pressable
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderTopWidth: 1,
                      borderTopColor: '#333',
                      backgroundColor: 'rgba(46, 213, 115, 0.1)',
                    }}
                    onPress={() => setShowNewCategoryInput(true)}>
                    <Text style={{color: '#2ed573', fontSize: 16, fontWeight: '600', textAlign: 'center'}}>
                      + Adicionar Nova Categoria
                    </Text>
                  </Pressable>
                }
                scrollEnabled={categories.length > 5}
                nestedScrollEnabled={true}
              />
            ) : (
              <View style={{padding: 16, borderBottomWidth: 1, borderBottomColor: '#333'}}>
                <Text style={{color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 12}}>Nova Categoria</Text>
                <TextInput
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderColor: '#333',
                    borderRadius: 8,
                    color: '#fff',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    marginBottom: 12,
                    fontSize: 14,
                  }}
                  placeholder="Nome da categoria"
                  placeholderTextColor="#666"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  editable={!creatingCategory}
                />

                <Text style={{color: '#fff', fontSize: 12, fontWeight: '600', marginBottom: 8}}>Cor</Text>
                <View style={{flexDirection: 'row', gap: 8, marginBottom: 16}}>
                  {['#2ED573', '#FF6B6B', '#FFD93D', '#6C5CE7', '#00B4D8'].map((color) => (
                    <Pressable
                      key={color}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: color,
                        borderWidth: newCategoryColor === color ? 3 : 0,
                        borderColor: '#fff',
                      }}
                      onPress={() => setNewCategoryColor(color)}
                    />
                  ))}
                </View>

                <View style={{gap: 8}}>
                  <Pressable
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      backgroundColor: '#2ed573',
                      borderRadius: 6,
                      alignItems: 'center',
                    }}
                    onPress={handleCreateNewCategory}
                    disabled={creatingCategory}>
                    {creatingCategory ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <Text style={{color: '#000', fontWeight: '700'}}>Criar</Text>
                    )}
                  </Pressable>

                  <Pressable
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 6,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#333',
                    }}
                    onPress={() => {
                      setShowNewCategoryInput(false);
                      setNewCategoryName('');
                      setNewCategoryColor('#2ED573');
                    }}
                    disabled={creatingCategory}>
                    <Text style={{color: '#999', fontWeight: '600'}}>Cancelar</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showCardPicker} transparent animationType="slide">
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end'}}>
          <View style={{backgroundColor: '#1a1a1a', borderTopLeftRadius: 12, borderTopRightRadius: 12}}>
            <View style={{padding: 16, borderBottomWidth: 1, borderBottomColor: '#333'}}>
              <Text style={{color: '#fff', fontSize: 18, fontWeight: '700'}}>Selecionar Cartão</Text>
            </View>
            <FlatList
              data={[{id: 'none', name: 'Qualquer cartão', brand: ''} as any, ...cards]}
              keyExtractor={(item) => item.id}
              renderItem={({item}) => (
                <Pressable
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#2a2a2a',
                  }}
                  onPress={() => {
                    setSelectedCard(item.id === 'none' ? null : item.id);
                    setShowCardPicker(false);
                  }}>
                  <Text style={{color: '#fff', fontSize: 16, fontWeight: '600'}}>{item.name}</Text>
                  {item.brand && <Text style={{color: '#999', fontSize: 12, marginTop: 4}}>{item.brand}</Text>}
                </Pressable>
              )}
              scrollEnabled={cards.length > 5}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
