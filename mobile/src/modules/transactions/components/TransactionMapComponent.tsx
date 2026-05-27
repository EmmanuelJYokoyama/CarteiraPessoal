import React, {useMemo} from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import type {Transaction} from '@services/api/transactions';

interface TransactionMapComponentProps {
  transactions: Transaction[];
  selectedTransaction?: Transaction;
  onMarkerPress?: (transaction: Transaction) => void;
  height?: number;
}

export function TransactionMapComponent({
  transactions,
  selectedTransaction,
  onMarkerPress,
  height = 300,
}: TransactionMapComponentProps) {
  // Filtrar transações com localização
  const transactionsWithLocation = useMemo(() => {
    return transactions.filter(tx => tx.latitude && tx.longitude);
  }, [transactions]);

  // Calcular região inicial do mapa
  const initialRegion = useMemo(() => {
    if (transactionsWithLocation.length === 0) {
      // Centro padrão (São Paulo, Brasil)
      return {
        latitude: -23.5505,
        longitude: -46.6333,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }

    const lats = transactionsWithLocation.map(t => t.latitude!);
    const lngs = transactionsWithLocation.map(t => t.longitude!);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = (maxLat - minLat) * 1.3;
    const lngDelta = (maxLng - minLng) * 1.3;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.0922),
      longitudeDelta: Math.max(lngDelta, 0.0421),
    };
  }, [transactionsWithLocation]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(value);

  if (transactionsWithLocation.length === 0) {
    return (
      <View style={{height, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{color: '#999', fontSize: 14}}>
          Nenhuma transação com localização disponível
        </Text>
      </View>
    );
  }

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion}
      style={{height, borderRadius: 8, overflow: 'hidden'}}
      scrollEnabled={true}
      zoomEnabled={true}
      showsUserLocation={true}
      showsMyLocationButton={true}
      showsCompass={true}>
      {transactionsWithLocation.map((transaction) => (
        <Marker
          key={transaction.id}
          coordinate={{
            latitude: transaction.latitude!,
            longitude: transaction.longitude!,
          }}
          title={transaction.description}
          description={`${formatCurrency(transaction.amount)} • ${new Date(transaction.transactionDate).toLocaleDateString('pt-BR')}`}
          pinColor={selectedTransaction?.id === transaction.id ? '#2ed573' : '#ff6b6b'}
          onPress={() => onMarkerPress?.(transaction)}>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: selectedTransaction?.id === transaction.id ? '#2ed573' : '#ff6b6b',
              borderRadius: 4,
            }}>
            <Text style={{color: '#fff', fontWeight: '600', fontSize: 11}}>
              {formatCurrency(transaction.amount)}
            </Text>
          </View>
        </Marker>
      ))}
    </MapView>
  );
}
