import React, {useEffect, useState, useRef} from 'react';
import {View, Text, FlatList, Pressable, SafeAreaView, ActivityIndicator} from 'react-native';
import {AddCardForm} from '../components/AddCardForm';
import {listCards, Card} from '@services/api/cards';

export default function CardsScreen() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [recentlyAddedCardId, setRecentlyAddedCardId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Formatadores
  function formatCardDigits(lastFour: string): string {
    return `•••• •••• •••• ${lastFour}`;
  }

  function formatExpiryDate(expiryDate: string): string {
    // Espera formato MM/YY
    const [month, year] = expiryDate.split('/');
    if (!month || !year) return expiryDate;
    return `${month}/20${year}`;
  }

  // Cores baseadas na marca do cartão
  function getCardBrandColor(brand: string): {bg: string; accent: string} {
    const brandLower = brand?.toLowerCase() || '';
    if (brandLower.includes('visa')) {
      return {bg: 'linear-gradient(135deg, #1a1f71 0%, #0066cc 100%)', accent: '#1434CB'};
    } else if (brandLower.includes('mastercard')) {
      return {bg: 'linear-gradient(135deg, #ff5f00 0%, #eb001b 100%)', accent: '#EB001B'};
    } else if (brandLower.includes('amex')) {
      return {bg: 'linear-gradient(135deg, #006fcf 0%, #003478 100%)', accent: '#006FCF'};
    } else if (brandLower.includes('elo')) {
      return {bg: 'linear-gradient(135deg, #ef3b39 0%, #ef7937 100%)', accent: '#EF3B39'};
    }
    return {bg: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)', accent: '#6c5ce7'};
  }

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
    setRecentlyAddedCardId(cardId);
    loadCards();
    
    // Clear recently added highlight after 5 seconds
    setTimeout(() => setRecentlyAddedCardId(null), 5000);
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#0a0a0a'}}>
      <View style={{flex: 1}}>
        <View style={{padding: 16, marginTop: 14, borderBottomWidth: 1, borderBottomColor: '#333'}}>
          <Text style={{fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 16, marginTop: 8}}>
            Meus Cartões
          </Text>
          {!showForm ? (
            <Pressable
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: '#fff',
                borderRadius: 8,
              }}
              onPress={() => setShowForm(true)}>
              <Text style={{color: '#000', textAlign: 'center', fontWeight: '600'}}>
                Adicionar Cartão
              </Text>
            </Pressable>
          ) : null}
        </View>

        {showForm ? (
          <View style={{flex: 1}}>
            <View style={{padding: 16, alignItems: 'flex-end'}}>
              <Pressable onPress={() => setShowForm(false)}>
                <Text style={{color: '#fff', fontSize: 16}}>✕</Text>
              </Pressable>
            </View>
            <AddCardForm onSuccess={handleCardAdded} />
          </View>
        ) : (
          <View style={{flex: 1}}>
            {loading ? (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            ) : cards.length === 0 ? (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{color: '#999', fontSize: 16, textAlign: 'center'}}>
                  Nenhum cartão adicionado ainda
                </Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={cards}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{padding: 16, paddingTop: 8}}
                renderItem={({item}) => {
                  const colors = getCardBrandColor(item.brand);
                  const isRecent = recentlyAddedCardId === item.id;
                  
                  return (
                    <View
                      style={{
                        marginBottom: 16,
                        borderRadius: 16,
                        overflow: 'hidden',
                        elevation: isRecent ? 12 : 8,
                        shadowColor: isRecent ? '#10b981' : '#000',
                        shadowOffset: {width: 0, height: isRecent ? 6 : 4},
                        shadowOpacity: isRecent ? 0.5 : 0.3,
                        shadowRadius: isRecent ? 12 : 8,
                        borderWidth: isRecent ? 2 : 0,
                        borderColor: isRecent ? '#10b981' : 'transparent',
                      }}>
                      {isRecent && (
                        <View
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            backgroundColor: '#10b981',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 4,
                            zIndex: 10,
                          }}>
                          <Text style={{fontSize: 10, fontWeight: '700', color: '#fff'}}>NOVO</Text>
                        </View>
                      )}
                      <View
                        style={{
                          backgroundColor: colors.accent,
                          padding: 20,
                          paddingBottom: 24,
                          borderRadius: 16,
                          justifyContent: 'space-between',
                        }}>
                        {/* Header do cartão */}
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: 32,
                          }}>
                          <Text
                            style={{
                              fontSize: 12,
                              color: 'rgba(255, 255, 255, 0.7)',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                            }}>
                            {item.brand?.toUpperCase()}
                          </Text>
                          <View
                            style={{
                              width: 40,
                              height: 24,
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              borderRadius: 4,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}>
                            <Text style={{color: 'rgba(255, 255, 255, 0.5)', fontSize: 10}}>
                              {item.brand?.substring(0, 1)}
                            </Text>
                          </View>
                        </View>

                        {/* Número do cartão */}
                        <View style={{marginBottom: 24}}>
                          <Text
                            style={{
                              fontSize: 18,
                              color: '#fff',
                              fontFamily: 'monospace',
                              fontWeight: '600',
                                letterSpacing: 2,
                              marginBottom: 8,
                            }}>
                            {formatCardDigits(item.lastFourDigits)}
                          </Text>
                        </View>

                        {/* Rodapé do cartão com nome e vencimento */}
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                          }}>
                          <View>
                            <Text
                              style={{
                                fontSize: 10,
                                color: 'rgba(255, 255, 255, 0.7)',
                                marginBottom: 4,
                                textTransform: 'uppercase',
                              }}>
                              Titular
                            </Text>
                            <Text
                              style={{
                                fontSize: 14,
                                color: '#fff',
                                fontWeight: '600',
                              }}
                              numberOfLines={1}>
                              {item.name}
                            </Text>
                          </View>
                          <View style={{alignItems: 'flex-end'}}>
                            <Text
                              style={{
                                fontSize: 10,
                                color: 'rgba(255, 255, 255, 0.7)',
                                marginBottom: 4,
                                textTransform: 'uppercase',
                              }}>
                              Vence
                            </Text>
                            <Text
                              style={{
                                fontSize: 14,
                                color: '#fff',
                                fontWeight: '600',
                                fontFamily: 'monospace',
                              }}>
                              {formatExpiryDate(item.expiryDate)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
