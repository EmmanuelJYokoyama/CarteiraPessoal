import React, {useState, useEffect} from 'react';
import {View, TextInput, Text, Pressable, ScrollView, ActivityIndicator, Modal, FlatList} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {createTransaction} from '@services/api/transactions';
import {listCards, Card} from '@services/api/cards';
import {styles} from './styles/AddTransactionForm.styles';

interface AddTransactionFormProps {
  onSuccess?: () => void;
}

const CATEGORIES = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Diversão', 'Outro'];

export function AddTransactionForm({onSuccess}: AddTransactionFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [installments, setInstallments] = useState('1');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  async function loadCards() {
    try {
      const data = await listCards();
      setCards(data);
      if (data.length > 0) {
        setSelectedCard(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar cartões:', error);
    }
  }

  function handleDateChange(event: any, selectedDate?: Date) {
    if (selectedDate) {
      setTransactionDate(selectedDate);
    }
    setShowDatePicker(false);
  }

  function validateForm(): boolean {
    if (!description.trim()) {
      setErrorMessage('Descrição é obrigatória');
      return false;
    }
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      setErrorMessage('Valor deve ser um número maior que zero');
      return false;
    }
    if (!category) {
      setErrorMessage('Selecione uma categoria');
      return false;
    }
    const inst = Number(installments);
    if (isNaN(inst) || inst < 1 || inst > 60) {
      setErrorMessage('Parcelas deve estar entre 1 e 60');
      return false;
    }
    setErrorMessage('');
    return true;
  }

  async function handleAddTransaction() {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrorMessage('');

      await createTransaction({
        description: description.trim(),
        amount,
        category,
        installments: Number(installments),
        cardId: selectedCard?.id,
        transactionDate: transactionDate.toISOString(),
      });

      setDescription('');
      setAmount('');
      setCategory('');
      setInstallments('1');
      setTransactionDate(new Date());
      onSuccess?.();
    } catch (error: any) {
      const message = error.message || 'Erro ao registrar despesa';
      setErrorMessage(message);
      console.error('Erro ao registrar despesa:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {errorMessage ? (
          <View style={styles.errorMessage}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Café, Supermercado, Combustível"
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Valor</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#666"
            value={amount}
            onChangeText={text => setAmount(text.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Categoria</Text>
          <Pressable
            style={styles.selectedCardContainer}
            onPress={() => setShowCategoryPicker(true)}>
            <Text style={styles.selectedCardText}>{category || 'Selecione uma categoria'}</Text>
          </Pressable>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cartão (Opcional)</Text>
          {cards.length > 0 ? (
            <Pressable
              style={styles.selectedCardContainer}
              onPress={() => setShowCardPicker(true)}>
              <Text style={styles.selectedCardText}>
                {selectedCard ? `${selectedCard.name} (${selectedCard.brand.toUpperCase()})` : 'Nenhum cartão'}
              </Text>
            </Pressable>
          ) : (
            <Text style={{color: '#999', fontSize: 14}}>Nenhum cartão disponível</Text>
          )}
        </View>

        <View style={styles.rowContainer}>
          <View style={[styles.inputGroup, styles.halfInput]}>
            <Text style={styles.label}>Data</Text>
            <Pressable
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateButtonText}>{transactionDate.toLocaleDateString('pt-BR')}</Text>
            </Pressable>
          </View>

          <View style={[styles.inputGroup, styles.halfInput]}>
            <Text style={styles.label}>Parcelas</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              placeholderTextColor="#666"
              value={installments}
              onChangeText={text => setInstallments(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              editable={!loading}
            />
          </View>
        </View>

        <Pressable
          style={[styles.submitButton, !loading ? {} : styles.submitButtonDisabled]}
          onPress={handleAddTransaction}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitButtonText}>Registrar Despesa</Text>
          )}
        </Pressable>
      </ScrollView>

      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={{flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)'}}>
          <View style={{backgroundColor: '#1a1a1a', margin: 40, borderRadius: 8, padding: 16}}>
            <DateTimePicker
              value={transactionDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              textColor="#fff"
            />
            <Pressable
              style={{
                marginTop: 16,
                backgroundColor: '#fff',
                padding: 12,
                borderRadius: 6,
                alignItems: 'center',
              }}
              onPress={() => setShowDatePicker(false)}>
              <Text style={{color: '#000', fontWeight: '600'}}>Fechar</Text>
            </Pressable>
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
              data={[{id: 'none', name: 'Nenhum cartão'} as any, ...cards]}
              keyExtractor={(item) => item.id}
              renderItem={({item}) => (
                <Pressable
                  style={styles.cardPickerItem}
                  onPress={() => {
                    if (item.id === 'none') {
                      setSelectedCard(null);
                    } else {
                      setSelectedCard(item);
                    }
                    setShowCardPicker(false);
                  }}>
                  <Text style={styles.cardPickerItemText}>
                    {item.name}
                    {item.id !== 'none' && ` (${item.brand.toUpperCase()})`}
                  </Text>
                </Pressable>
              )}
              scrollEnabled={cards.length > 5}
              nestedScrollEnabled={true}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showCategoryPicker} transparent animationType="slide">
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end'}}>
          <View style={{backgroundColor: '#1a1a1a', borderTopLeftRadius: 12, borderTopRightRadius: 12}}>
            <View style={{padding: 16, borderBottomWidth: 1, borderBottomColor: '#333'}}>
              <Text style={{color: '#fff', fontSize: 18, fontWeight: '700'}}>Selecionar Categoria</Text>
            </View>
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item}
              renderItem={({item}) => (
                <Pressable
                  style={styles.cardPickerItem}
                  onPress={() => {
                    setCategory(item);
                    setShowCategoryPicker(false);
                  }}>
                  <Text style={styles.cardPickerItemText}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
