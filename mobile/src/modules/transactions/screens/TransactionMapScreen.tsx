import React, {useMemo} from 'react';
import {View, Text, SafeAreaView, Pressable, ActivityIndicator} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {ArrowLeft} from 'lucide-react-native';
import {Transaction} from '@services/api/transactions';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'TransactionMap'>;

export default function TransactionMapScreen({navigation, route}: Props) {
  const transaction = route.params?.transaction as Transaction | undefined;

  const latitude = useMemo(() => {
    if (!transaction?.latitude) return null;
    return Number(transaction.latitude);
  }, [transaction?.latitude]);

  const longitude = useMemo(() => {
    if (!transaction?.longitude) return null;
    return Number(transaction.longitude);
  }, [transaction?.longitude]);

  const hasLocation = useMemo(
    () => latitude !== null && longitude !== null && Number.isFinite(latitude) && Number.isFinite(longitude),
    [latitude, longitude]
  );

  const formattedAmount = useMemo(() => {
    if (!transaction) return 'R$ 0,00';
    const num = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  }, [transaction]);

  if (!transaction) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: '#0a0a0a'}}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{color: '#999'}}>Transação não encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasLocation) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: '#0a0a0a'}}>
        <View style={{flex: 1}}>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#333',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}>
            <Pressable onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color="#fff" />
            </Pressable>
            <View style={{flex: 1}}>
              <Text style={{fontSize: 16, fontWeight: '600', color: '#fff'}}>
                {transaction.description}
              </Text>
              <Text style={{fontSize: 13, color: '#999', marginTop: 2}}>
                {formattedAmount}
              </Text>
            </View>
          </View>

          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16}}>
            <Text style={{color: '#999', fontSize: 14, textAlign: 'center'}}>
              Localização não disponível para esta despesa
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#0a0a0a'}}>
      <View style={{flex: 1}}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#333',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: '#1a1a1a',
          }}>
          <Pressable onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
          <View style={{flex: 1}}>
            <Text style={{fontSize: 16, fontWeight: '600', color: '#fff'}}>
              {transaction.description}
            </Text>
            <Text style={{fontSize: 13, color: '#999', marginTop: 2}}>
              {transaction.location || 'Localização registrada'}
            </Text>
          </View>
        </View>

        {/* Map */}
        <View style={{flex: 1}}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={{flex: 1}}
            initialRegion={{
              latitude,
              longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}>
            <Marker
              coordinate={{
                latitude,
                longitude,
              }}
              title={transaction.description}
              description={transaction.category || 'Despesa registrada'}
              pinColor="#2ed573"
            />
          </MapView>
        </View>

        {/* Footer Info */}
        <View
          style={{
            backgroundColor: '#1a1a1a',
            borderTopWidth: 1,
            borderTopColor: '#333',
            padding: 16,
            gap: 12,
          }}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <Text style={{color: '#999', fontSize: 12}}>Valor</Text>
            <Text style={{color: '#fff', fontSize: 14, fontWeight: '600'}}>
              {formattedAmount}
            </Text>
          </View>
          {transaction.category && (
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Text style={{color: '#999', fontSize: 12}}>Categoria</Text>
              <Text style={{color: '#fff', fontSize: 14, fontWeight: '600'}}>
                {transaction.category}
              </Text>
            </View>
          )}
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <Text style={{color: '#999', fontSize: 12}}>Data</Text>
            <Text style={{color: '#fff', fontSize: 14, fontWeight: '600'}}>
              {new Date(transaction.transactionDate).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
