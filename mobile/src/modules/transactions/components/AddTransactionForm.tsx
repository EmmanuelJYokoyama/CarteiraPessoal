import React, {useState, useEffect} from 'react';
import {View, TextInput, Text, Pressable, ScrollView, ActivityIndicator, Modal, FlatList, Alert, Platform, PermissionsAndroid, Linking} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {createTransaction, checkDuplicateTransactions, suggestCategory, type CategorySuggestion, type CreateTransactionPayload} from '@services/api/transactions';
import {API_BASE_URL} from '@services/api/client';
import {listCards, Card} from '@services/api/cards';
import {invalidateCache} from '@services/cache';
import {recordCategoryLearning} from '@services/categorySuggestion';
import {useCategories} from '../hooks/useCategories';
import {styles} from './styles/AddTransactionForm.styles';

const currencyOptions = [
  {code: 'BRL', label: 'Real brasileiro'},
  {code: 'USD', label: 'Dólar americano'},
  {code: 'EUR', label: 'Euro'},
];

type DeviceLocation = {
  latitude: number;
  longitude: number;
};

interface AddTransactionFormProps {
  onSuccess?: () => void;
}

export function AddTransactionForm({onSuccess}: AddTransactionFormProps) {
  const {categories, addCategory} = useCategories();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [category, setCategory] = useState('');
  const [installments, setInstallments] = useState('1');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#2ED573');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<DeviceLocation | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [categorySuggestion, setCategorySuggestion] = useState<CategorySuggestion | null>(null);
  const [suggestingCategory, setSuggestingCategory] = useState(false);
  const selectedCurrency = currencyOptions.find(option => option.code === currency) ?? currencyOptions[0];

  console.log('[AddTransactionForm] Renderizando. Description:', description, 'Sugestão:', categorySuggestion);

  useEffect(() => {
    loadCards();

    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      locationProvider: 'auto',
    });
  }, []);

  // Sugerir categoria quando a descrição muda
  useEffect(() => {
    console.log('[UseEffect] Description mudou para:', description);
    
    async function fetchSuggestion() {
      if (!description || description.trim().length < 3) {
        console.log('[UseEffect] Description muito curta, limpando sugestão');
        setCategorySuggestion(null);
        return;
      }

      console.log('[UseEffect] Acionando sugestão para:', description);
      setSuggestingCategory(true);
      try {
        const response = await suggestCategory(description);
        console.log('[UseEffect] Resultado da sugestão:', response);
        
        // Use the top suggestion from the response
        if (response.topSuggestion) {
          setCategorySuggestion(response.topSuggestion);
        } else {
          setCategorySuggestion(null);
        }
      } catch (error) {
        console.error('[UseEffect] Erro ao obter sugestão:', error);
        setCategorySuggestion(null);
      } finally {
        setSuggestingCategory(false);
      }
    }

    const debounceTimer = setTimeout(() => {
      console.log('[UseEffect] Debounce finalizado, chamando fetchSuggestion');
      fetchSuggestion();
    }, 500); // Debounce de 500ms

    return () => {
      console.log('[UseEffect] Limpando timeout anterior');
      clearTimeout(debounceTimer);
    };
  }, [description]);

  async function ensureLocationPermission() {
    if (Platform.OS === 'ios') {
      Geolocation.requestAuthorization();
      return true;
    }

    const finePermission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;

    try {
      const hasFine = await PermissionsAndroid.check(finePermission);
      if (hasFine) {
        return true;
      }

      const result = await PermissionsAndroid.request(finePermission, {
        title: 'Permissão de localização',
        message: 'Precisamos da sua localização atual para registrar onde a despesa ocorreu.',
        buttonPositive: 'Permitir',
        buttonNegative: 'Agora não',
      });

      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      }

      if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'Permissão bloqueada',
          'A localização está bloqueada para este app. Ative nas configurações do dispositivo.',
          [
            {text: 'Cancelar', style: 'cancel'},
            {text: 'Abrir configurações', onPress: () => Linking.openSettings()},
          ],
        );
      }

      return false;
    } catch (error) {
      console.error('Erro ao solicitar permissão de localização:', error);
      return false;
    }
  }

  function getCurrentPosition(options: Parameters<typeof Geolocation.getCurrentPosition>[2]) {
    return new Promise<DeviceLocation>((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => reject(error),
        options,
      );
    });
  }

  async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const url = `${API_BASE_URL}/location/address?latitude=${latitude}&longitude=${longitude}`;
      
      console.log('[AddTransactionForm] Chamando reverse geocoding:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log('[AddTransactionForm] Response não OK, status:', response.status);
        console.log('[AddTransactionForm] Continuando sem nome do local');
        return null;
      }

      const data = await response.json();
      console.log('[AddTransactionForm] Endereço recebido:', data);
      
      // Prioridade: name > fullAddress > null
      if (data.name) {
        console.log('[AddTransactionForm] Endereço obtido:', data.name);
        return data.name;
      } else if (data.fullAddress) {
        console.log('[AddTransactionForm] Endereço completo obtido:', data.fullAddress);
        return data.fullAddress;
      } else {
        console.log('[AddTransactionForm] Nenhum nome de local encontrado na resposta');
        return null;
      }
    } catch (error) {
      console.error('[AddTransactionForm] Erro ao obter endereço:', error);
      console.log('[AddTransactionForm] Continuando sem nome do local');
      return null;
    }
  }

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
      setCategory(newCategory.name);
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

  function handleDateChange(_event: any, selectedDate?: Date) {
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
    if (!currency.trim() || !/^[A-Za-z]{3}$/.test(currency.trim())) {
      setErrorMessage('Moeda deve ter 3 letras, como BRL ou USD');
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

  async function handleGetCurrentLocation() {
    try {
      setFetchingLocation(true);

      const granted = await ensureLocationPermission();
      if (!granted) {
        Alert.alert('Permissão negada', 'Ative a localização para registrar a despesa com a posição atual.');
        return;
      }

      try {
        const preciseLocation = await getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
        setSelectedLocation(preciseLocation);
        const locationName = await reverseGeocode(preciseLocation.latitude, preciseLocation.longitude);
        setLocationName(locationName);
        return;
      } catch (preciseError) {
        console.warn('Falha em alta precisão, tentando modo balanceado:', preciseError);
      }

      try {
        const fallbackLocation = await getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 60000,
        });
        setSelectedLocation(fallbackLocation);
        const locationName = await reverseGeocode(fallbackLocation.latitude, fallbackLocation.longitude);
        setLocationName(locationName);
      } catch (fallbackError: any) {
        console.error('Erro ao obter localização atual:', fallbackError);
        Alert.alert(
          'Falha ao obter localização',
          fallbackError?.code === 1
            ? 'Permissão de localização negada no sistema. Verifique as permissões do app nas configurações.'
            : 'Não foi possível capturar a localização atual do dispositivo.',
        );
      }
    } finally {
      setFetchingLocation(false);
    }
  }

  async function handleAddTransaction() {
    if (!validateForm()) return;

    // Construir payload sem campos undefined/null desnecessários
    const payload: CreateTransactionPayload = {
      description: description.trim(),
      amount,
      currency: currency.trim().toUpperCase(),
      category,
      installments: Number(installments),
      transactionDate: transactionDate.toISOString(),
    };

    // Adicionar cartão apenas se estiver selecionado
    if (selectedCard?.id) {
      payload.cardId = selectedCard.id;
    }

    // Adicionar nome do lugar apenas se conseguiu fazer o reverse geocoding
    if (locationName) {
      payload.location = locationName;
    }

    const saveTransaction = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        await createTransaction(payload);

        if (payload.category) {
          await recordCategoryLearning(payload.description, payload.category);
        }

        // Invalidate budget cache if transaction has a category
        if (payload.category) {
          await invalidateCache('budgets');
        }

        setDescription('');
        setAmount('');
        setCurrency('BRL');
        setCategory('');
        setInstallments('1');
        setTransactionDate(new Date());
        setSelectedLocation(null);
        setLocationName(null);
        onSuccess?.();
      } catch (error: any) {
        const message = error.message || 'Erro ao registrar despesa';
        setErrorMessage(message);
        console.error('Erro ao registrar despesa:', error);
      } finally {
        setLoading(false);
      }
    };

    try {
      setLoading(true);
      setErrorMessage('');

      const duplicateCheck = await checkDuplicateTransactions({
        description: payload.description,
        amount: payload.amount,
        currency: payload.currency,
        transactionDate: payload.transactionDate,
        cardId: payload.cardId,
      });

      setLoading(false);

      if (duplicateCheck.count > 0) {
        const duplicate = duplicateCheck.duplicates[0];
        const formattedDate = new Date(duplicate.transactionDate).toLocaleDateString('pt-BR');
        const formattedAmount = Number(duplicate.amount).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });

        Alert.alert(
          'Possível duplicata',
          `Encontramos um lançamento parecido:\n\n${duplicate.description}\n${formattedAmount} • ${formattedDate}\n\nDeseja salvar mesmo assim?`,
          [
            {text: 'Cancelar', style: 'cancel'},
            {text: 'Salvar mesmo assim', onPress: () => void saveTransaction()},
          ]
        );
        return;
      }

      await saveTransaction();
    } catch (error: any) {
      const message = error.message || 'Erro ao registrar despesa';
      setErrorMessage(message);
      console.error('Erro ao verificar duplicatas:', error);
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
          <Text style={styles.label}>Valor da despesa</Text>
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
          <Text style={styles.label}>Moeda da despesa</Text>
          <Pressable
            style={styles.selectedCardContainer}
            onPress={() => setShowCurrencyPicker(true)}
            disabled={loading}>
            <View>
              <Text style={styles.selectorTitle}>{selectedCurrency.label}</Text>
              <Text style={styles.selectorSubtitle}>{selectedCurrency.code} • cotação oficial do BCB</Text>
            </View>
          </Pressable>
          <Text style={styles.fieldHint}>
            Escolha apenas Real, Dólar ou Euro.
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Categoria</Text>
          <Pressable
            style={styles.selectedCardContainer}
            onPress={() => setShowCategoryPicker(true)}>
            <Text style={styles.selectorTitle}>{category || 'Selecione uma categoria'}</Text>
          </Pressable>

          {suggestingCategory && (
            <View style={{marginTop: 8, paddingHorizontal: 12, paddingVertical: 8}}>
              <ActivityIndicator size="small" color="#2ed573" />
              <Text style={styles.suggestionMeta}>Buscando sugestão...</Text>
            </View>
          )}

          {categorySuggestion && !suggestingCategory && (
            <>
              {console.log('[Render] Renderizando sugestão:', categorySuggestion)}
              <Pressable
                style={styles.suggestionCard}
                onPress={() => {
                  console.log('[Render] Aceitando sugestão:', categorySuggestion.name);
                  setCategory(categorySuggestion.name);
                }}>
                <Text style={styles.suggestionTitle}>Sugestão automática</Text>
                <Text style={styles.suggestionValue}>{categorySuggestion.name}</Text>
                <Text style={styles.suggestionMeta}>Score {categorySuggestion.score}</Text>
                <Text style={styles.suggestionHint}>Toque para aplicar esta categoria</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cartão (Opcional)</Text>
          {cards.length > 0 ? (
            <Pressable
              style={[
                styles.selectedCardContainer,
                {
                  backgroundColor: selectedCard
                    ? 'rgba(46, 213, 115, 0.1)'
                    : 'rgba(255, 255, 255, 0.05)',
                  borderColor: selectedCard ? '#2ed573' : '#444',
                  borderWidth: 1,
                },
              ]}
              onPress={() => setShowCardPicker(true)}>
              {selectedCard ? (
                <View>
                  <Text
                    style={styles.selectedCardBrand}>
                    {selectedCard.brand.toUpperCase()}
                  </Text>
                  <Text style={styles.selectorTitle}>
                    {selectedCard.name}
                  </Text>
                  <Text style={styles.selectorSubtitle}>
                    •••• {selectedCard.lastFourDigits}
                  </Text>
                </View>
              ) : (
                <Text style={styles.selectorTitle}>Nenhum cartão</Text>
              )}
            </Pressable>
          ) : (
            <Text style={styles.fieldHint}>
              Nenhum cartão disponível
            </Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Localização da despesa</Text>
          <Pressable
            style={styles.selectedCardContainer}
            onPress={handleGetCurrentLocation}
            disabled={fetchingLocation || loading}>
            <Text style={styles.selectorTitle}>
              {fetchingLocation
                ? 'Capturando localização atual...'
                : locationName
                  ? locationName
                  : 'Usar localização atual do dispositivo'}
            </Text>
          </Pressable>
          <Text style={styles.fieldHint}>
            A localização é capturada automaticamente pelo GPS do aparelho.
          </Text>
          {selectedLocation && locationName ? (
            <Pressable
              onPress={() => {
                setSelectedLocation(null);
                setLocationName(null);
              }}
              style={{marginTop: 8}}>
              <Text style={styles.warningText}>
                Limpar localização
              </Text>
            </Pressable>
          ) : null}
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

      <Modal visible={showCurrencyPicker} transparent animationType="slide">
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end'}}>
          <View style={{backgroundColor: '#1a1a1a', borderTopLeftRadius: 12, borderTopRightRadius: 12}}>
            <View style={{padding: 16, borderBottomWidth: 1, borderBottomColor: '#333', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Text style={styles.modalTitle}>Selecionar moeda</Text>
              <Pressable onPress={() => setShowCurrencyPicker(false)}>
                <Text style={styles.modalCloseText}>×</Text>
              </Pressable>
            </View>

            {currencyOptions.map(option => (
              <Pressable
                key={option.code}
                style={[
                  styles.currencyPickerItem,
                  currency === option.code ? styles.currencyPickerItemSelected : null,
                ]}
                onPress={() => {
                  setCurrency(option.code);
                  setShowCurrencyPicker(false);
                }}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <View>
                    <Text style={styles.currencyPickerItemText}>{option.label}</Text>
                    <Text style={styles.currencyPickerItemSubtext}>{option.code}</Text>
                  </View>
                  {currency === option.code ? (
                    <Text style={styles.currencyPickerCheck}>✓</Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={showCardPicker} transparent animationType="slide">
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end'}}>
          <View style={{backgroundColor: '#1a1a1a', borderTopLeftRadius: 12, borderTopRightRadius: 12}}>
            <View style={{padding: 16, borderBottomWidth: 1, borderBottomColor: '#333'}}>
              <Text style={styles.modalTitle}>Selecionar cartão</Text>
            </View>
            <FlatList
              data={[{id: 'none', name: 'Nenhum cartão', brand: ''} as any, ...cards]}
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
                    if (item.id === 'none') {
                      setSelectedCard(null);
                    } else {
                      setSelectedCard(item);
                    }
                    setShowCardPicker(false);
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                    <View style={{flex: 1}}>
                      <Text
                        style={{
                          color: '#fff',
                          fontSize: 16,
                          fontWeight: '600',
                          marginBottom: 4,
                        }}>
                        {item.name}
                      </Text>
                      {item.brand && (
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                          <Text
                            style={{
                              color: '#999',
                              fontSize: 12,
                            }}>
                            {item.brand.toUpperCase()}
                          </Text>
                          <Text style={{color: '#666', fontSize: 12}}>
                            •••• {item.lastFourDigits}
                          </Text>
                        </View>
                      )}
                    </View>
                    {selectedCard?.id === item.id && (
                      <Text style={{color: '#2ed573', fontSize: 16}}>✓</Text>
                    )}
                  </View>
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
          <View style={{backgroundColor: '#1a1a1a', borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: '80%'}}>
            <View style={{padding: 16, borderBottomWidth: 1, borderBottomColor: '#333', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Text style={styles.modalTitle}>Selecionar categoria</Text>
              <Pressable onPress={() => setShowCategoryPicker(false)}>
                <Text style={styles.modalCloseText}>×</Text>
              </Pressable>
            </View>
            
            {showNewCategoryInput ? (
              <View style={{padding: 16, borderBottomWidth: 1, borderBottomColor: '#333'}}>
                <Text style={styles.modalSectionTitle}>Nova categoria</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome da categoria"
                  placeholderTextColor="#666"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  editable={!creatingCategory}
                />
                <View style={{flexDirection: 'row', gap: 8, marginTop: 12}}>
                  <Pressable
                    style={[styles.submitButton, {flex: 1}]}
                    onPress={handleCreateNewCategory}
                    disabled={creatingCategory}>
                    {creatingCategory ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <Text style={styles.submitButtonText}>Criar</Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={[styles.submitButton, {flex: 1, backgroundColor: '#444'}]}
                    onPress={() => {
                      setShowNewCategoryInput(false);
                      setNewCategoryName('');
                    }}
                    disabled={creatingCategory}>
                    <Text style={styles.submitButtonText}>Cancelar</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            
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
                    setCategory(item.name);
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
                  {category === item.name && (
                    <Text style={{color: '#2ed573', fontSize: 18, fontWeight: '700'}}>✓</Text>
                  )}
                </Pressable>
              )}
              scrollEnabled={categories.length > 5}
              nestedScrollEnabled={true}
            />
            
            <Pressable
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderTopWidth: 1,
                borderTopColor: '#333',
                backgroundColor: 'rgba(46, 213, 115, 0.1)',
              }}
              onPress={() => setShowNewCategoryInput(true)}>
              <Text style={styles.actionLinkText}>
                + Adicionar Nova Categoria
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
