import {View, TextInput, Text, Pressable, ScrollView, ActivityIndicator, KeyboardAvoidingView} from 'react-native';
import {useCardBrandDetection, getCardBrandColor, getCardBrandLabel} from '@hooks/useCardBrandDetection';
import {cardsService} from '@services/cardsService';
import {styles} from './styles/AddCardForm.styles';

interface AddCardFormProps {
  onSuccess?: (cardId: string) => void;
}

export function AddCardForm({onSuccess}: AddCardFormProps) {
  const {
    name,
    setName,
    cardNumber,
    setCardNumber,
    cardType,
    setCardType,
    expiryDate,
    setExpiryDate,
    errorMessage,
    loading,
    canSubmit,
    handleAddCard,
  } = cardsService((cardId) => {
    onSuccess?.(cardId);
  });

  const brand = useCardBrandDetection(cardNumber);
  const brandColor = getCardBrandColor(brand);
  const brandLabel = getCardBrandLabel(brand);

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding" enabled={true}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {errorMessage ? (
          <View style={styles.errorMessage}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome do Cartão</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Visa Pessoal"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipo de Cartão</Text>
          <View style={{flexDirection: 'row', gap: 8}}>
            {(['credit', 'debit', 'prepaid'] as const).map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.typeButton,
                  cardType === type && styles.typeButtonActive,
                ]}
                onPress={() => !loading && setCardType(type)}>
                <Text
                  style={[
                    styles.typeButtonText,
                    cardType === type && styles.typeButtonTextActive,
                  ]}>
                  {type === 'credit' ? 'Crédito' : type === 'debit' ? 'Débito' : 'Pré-pago'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Número do Cartão</Text>
          <TextInput
            style={styles.input}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor="#666"
            value={cardNumber}
            onChangeText={text => setCardNumber(text.replace(/\D/g, '').slice(0, 19))}
            keyboardType="numeric"
          />

          {cardNumber.length >= 4 && (
            <View style={styles.brandContainer}>
              <View style={[styles.brandBox, {backgroundColor: brandColor}]}>
                <Text style={styles.brandText}>{brand.toUpperCase().slice(0, 2)}</Text>
              </View>
              <View style={styles.brandInfo}>
                <Text style={styles.brandLabel}>{brandLabel}</Text>
                <Text style={styles.lastFourDigits}>Últimos 4 dígitos: {cardNumber.slice(-4)}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Validade (MM/YY)</Text>
          <TextInput
            style={styles.input}
            placeholder="1225"
            placeholderTextColor="#666"
            value={expiryDate.replace(/\D/g, '')}
            onChangeText={text => {
              const cleaned = text.replace(/\D/g, '').slice(0, 4);
              if (cleaned.length <= 2) {
                setExpiryDate(cleaned);
              } else {
                const formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
                setExpiryDate(formatted);
              }
            }}
            keyboardType="numeric"
            editable={!loading}
            maxLength={5}
          />
          {expiryDate && expiryDate.length >= 2 && (
            <Text style={{fontSize: 12, color: '#888', marginTop: 4}}>
              Formato: {expiryDate.includes('/') ? expiryDate : expiryDate.replace(/(\d{2})(\d*)/, '$1/$2')}
            </Text>
          )}
        </View>

        <Pressable
          style={[styles.submitButton, !canSubmit || loading ? {opacity: 0.6} : {}]}
          onPress={handleAddCard}
          disabled={!canSubmit || loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Adicionar Cartão</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
