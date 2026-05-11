import React, {useState, useCallback} from 'react';
import {View, Pressable, Text, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {X} from 'lucide-react-native';
import {useFocusEffect} from '@react-navigation/native';
import {listCards, Card} from '@services/api/cards';
import {ImportStatementForm} from '../components/ImportStatementForm';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'ImportStatement'>;

export default function ImportStatementScreen({navigation}: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [])
  );

  async function loadCards() {
    try {
      setLoading(true);
      const data = await listCards();
      setCards(data);
      if (data.length > 0 && !selectedCardId) {
        setSelectedCardId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar cartões:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSuccess = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#0a0a0a'}}>
      <View style={{flex: 1}}>
        {/* Header */}
        <View
          style={{
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#333',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text style={{fontSize: 18, fontWeight: '700', color: '#fff'}}>
            Importar Extrato
          </Text>
          <Pressable onPress={() => navigation.goBack()} disabled={loading}>
            <X size={24} color="#e8e8e8" />
          </Pressable>
        </View>

        {/* Loading */}
        {loading && cards.length === 0 ? (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{color: '#999', marginTop: 12}}>Carregando cartões...</Text>
          </View>
        ) : null}

        {/* Card Selection */}
        {!loading && cards.length > 1 && (
          <View style={{padding: 16, borderBottomWidth: 1, borderBottomColor: '#333'}}>
            <Text style={{fontSize: 14, fontWeight: '600', color: '#999', marginBottom: 12}}>
              Cartão de Destino
            </Text>
            <View style={{flexDirection: 'row', gap: 8}}>
              {cards.map((card) => (
                <Pressable
                  key={card.id}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    backgroundColor:
                      selectedCardId === card.id
                        ? 'rgba(52, 152, 219, 0.3)'
                        : 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor:
                      selectedCardId === card.id ? '#3498db' : 'rgba(255, 255, 255, 0.1)',
                  }}
                  onPress={() => setSelectedCardId(card.id)}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: selectedCardId === card.id ? '#3498db' : '#999',
                      fontWeight: '600',
                      textAlign: 'center',
                    }}>
                    {card.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: selectedCardId === card.id ? '#3498db' : '#666',
                      textAlign: 'center',
                      marginTop: 4,
                    }}>
                    {(card as any).lastDigits && `****${(card as any).lastDigits}`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Import Form */}
        {!loading && selectedCardId && (
          <ImportStatementForm
            cardId={selectedCardId}
            onSuccess={handleSuccess}
          />
        )}

        {/* No Cards */}
        {!loading && cards.length === 0 && (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32}}>
            <Text style={{color: '#999', fontSize: 16, textAlign: 'center'}}>
              Nenhum cartão disponível.{'\n'}Crie um cartão primeiro.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
