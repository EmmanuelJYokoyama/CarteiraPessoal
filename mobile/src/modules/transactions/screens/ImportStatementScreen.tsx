import React from 'react';
import {View, SafeAreaView, Pressable, Text} from 'react-native';
import {X} from 'lucide-react-native';
import {useCards} from '@modules/cards/hooks/useCards';
import {ImportStatementForm} from '../components/ImportStatementForm';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'ImportStatement'>;

export default function ImportStatementScreen({navigation}: Props) {
  const {cards} = useCards();
  const [selectedCardId, setSelectedCardId] = React.useState<string | null>(
    cards.length > 0 ? cards[0].id : null
  );

  React.useEffect(() => {
    if (cards.length > 0 && !selectedCardId) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

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
          <Pressable onPress={() => navigation.goBack()}>
            <X size={24} color="#e8e8e8" />
          </Pressable>
        </View>

        {/* Card Selection */}
        {cards.length > 1 && (
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
                    {card.cardName}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: selectedCardId === card.id ? '#3498db' : '#666',
                      textAlign: 'center',
                      marginTop: 4,
                    }}>
                    {card.lastDigits && `****${card.lastDigits}`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Import Form */}
        {selectedCardId && (
          <ImportStatementForm
            cardId={selectedCardId}
            onSuccess={handleSuccess}
          />
        )}

        {cards.length === 0 && (
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
