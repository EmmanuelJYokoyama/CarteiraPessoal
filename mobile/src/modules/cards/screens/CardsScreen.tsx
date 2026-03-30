import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, Pressable, SafeAreaView, ActivityIndicator} from 'react-native';
import {AddCardForm} from '../components/AddCardForm';
import {listCards, Card} from '@services/api/cards';

export default function CardsScreen() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  async function loadCards() {
    try {
      setLoading(true);
      const data = await listCards();
      setCards(data);
    } catch (error) {
      console.error('Erro ao carregar cartões:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCardAdded(cardId: string) {
    setShowForm(false);
    loadCards();
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <View style={{flex: 1}}>
        <View style={{padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee'}}>
          <Text style={{fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 16}}>
            Meus Cartões
          </Text>
          {!showForm ? (
            <Pressable
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: '#0066cc',
                borderRadius: 8,
              }}
              onPress={() => setShowForm(true)}>
              <Text style={{color: '#fff', textAlign: 'center', fontWeight: '600'}}>
                Adicionar Cartão
              </Text>
            </Pressable>
          ) : null}
        </View>

        {showForm ? (
          <View style={{flex: 1}}>
            <View style={{padding: 16, alignItems: 'flex-end'}}>
              <Pressable onPress={() => setShowForm(false)}>
                <Text style={{color: '#666', fontSize: 16}}>✕</Text>
              </Pressable>
            </View>
            <AddCardForm onSuccess={handleCardAdded} />
          </View>
        ) : (
          <View style={{flex: 1}}>
            {loading ? (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size="large" color="#0066cc" />
              </View>
            ) : cards.length === 0 ? (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{color: '#999', fontSize: 16, textAlign: 'center'}}>
                  Nenhum cartão adicionado ainda
                </Text>
              </View>
            ) : (
              <FlatList
                data={cards}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => (
                  <View
                    style={{
                      padding: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: '#eee',
                    }}>
                    <Text style={{fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4}}>
                      {item.name}
                    </Text>
                    <Text style={{fontSize: 12, color: '#666', marginBottom: 8}}>
                      {item.brand?.toUpperCase()} • ••••{' '}
                      {item.lastFourDigits}
                    </Text>
                    <Text style={{fontSize: 12, color: '#999'}}>
                      Vence em: {item.expiryDate}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
