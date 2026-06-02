// import React, {useEffect, useState} from 'react';
// import {View, Text, ActivityIndicator, Pressable, Platform, PermissionsAndroid} from 'react-native';

// interface HomeMapComponentProps {
//   height?: number;
//   onLocationChange?: (location: UserLocation) => void;
// }

// export function HomeMapComponent({height = 250, onLocationChange}: HomeMapComponentProps) {
//   const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     (async () => {
//       // On Android, request runtime permission first
//       if (Platform.OS === 'android') {
//         try {
//           const granted = await PermissionsAndroid.request(
//             PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//             {
//               title: 'Permissão de localização',
//               message: 'Precisamos da sua localização para mostrar no mapa.',
//               buttonPositive: 'Permitir',
//               buttonNegative: 'Agora não',
//             },
//           );

//           if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//             setError('Permissão de localização negada');
//             setLoading(false);
//             // set default location (São Paulo)
//             const defaultLocation = {latitude: -23.5505, longitude: -46.6333};
//             setUserLocation(defaultLocation);
//             onLocationChange?.(defaultLocation);
//             return;
//           }
//         } catch (err) {
//           console.warn('Erro ao pedir permissão de localização Android', err);
//         }
//       } else if (Platform.OS === 'ios') {
//         // if iOS and using a native lib, request authorization if available
//         try {
//           await Geolocation.requestAuthorization('whenInUse');
//         } catch (e) {
//           // ignore
//         }
//       }

//       getCurrentLocation();
//     })();
//   }, []);

//   const getCurrentLocation = () => {
//     setLoading(true);
//     setError(null);

//     try {
//       Geolocation.getCurrentPosition(
//         (position: any) => {
//           const {latitude, longitude} = position.coords;
//           const location = {latitude, longitude};
//           setUserLocation(location);
//           setError(null);
//           setLoading(false);
//           onLocationChange?.(location);

//           console.log('[HomeMap] Localização obtida:', location);
//         },
//         (error: any) => {
//           console.error('[HomeMap] Erro ao obter localização:', error);
//           setLoading(false);

//           // Se não conseguir localização, usar São Paulo como padrão
//           const defaultLocation = {latitude: -23.5505, longitude: -46.6333};
//           setUserLocation(defaultLocation);
//           onLocationChange?.(defaultLocation);

//           // Mostrar erro apenas se não for "No location provider available"
//           if (error.code !== 2) {
//             setError(error.message);
//           }
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 20000,
//           maximumAge: 60000,
//           distanceFilter: 10
//         }
//       );
//     } catch (error) {
//       console.error('[HomeMap] getCurrentPosition lançou erro:', error);
//       const defaultLocation = {latitude: -23.5505, longitude: -46.6333};
//       setUserLocation(defaultLocation);
//       onLocationChange?.(defaultLocation);
//       setLoading(false);
//       setError(null);
//     }
//   };

//   if (loading) {
//     return (
//       <View style={{height, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center'}}>
//         <ActivityIndicator size="large" color="#3b82f6" />
//         <Text style={{color: '#6b7280', marginTop: 12, fontSize: 14}}>
//           Obtendo localização...
//         </Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={{height, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16}}>
//         <Text style={{color: '#dc2626', marginBottom: 12, fontSize: 13, textAlign: 'center', fontWeight: '600'}}>
//           ⚠️ Erro ao obter localização
//         </Text>
//         <Text style={{color: '#991b1b', fontSize: 12, textAlign: 'center', marginBottom: 12}}>
//           {error}
//         </Text>
//         <Pressable
//           onPress={getCurrentLocation}
//           style={{
//             flexDirection: 'row',
//             alignItems: 'center',
//             backgroundColor: '#2563eb',
//             paddingHorizontal: 12,
//             paddingVertical: 8,
//             borderRadius: 6,
//           }}>
//           <RotateCcw size={16} color="#fff" />
//           <Text style={{color: '#fff', fontSize: 12, marginLeft: 6, fontWeight: '600'}}>
//             Tentar novamente
//           </Text>
//         </Pressable>
//       </View>
//     );
//   }

//   return (
//     <View style={{height, borderRadius: 8, overflow: 'hidden', backgroundColor: '#f3f4f6'}}>
//       {userLocation && (
//         <MapView
//           style={{flex: 1}}
//           initialRegion={{
//             latitude: userLocation.latitude,
//             longitude: userLocation.longitude,
//             latitudeDelta: 0.01,
//             longitudeDelta: 0.01,
//           }}
//           showsUserLocation={true}
//           followsUserLocation={true}
//           loadingEnabled={true}>
          
//           {/* Marcador do usuário */}
//           <Marker
//             coordinate={{latitude: userLocation.latitude, longitude: userLocation.longitude}}
//             title="Sua Localização"
//             description={`${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`}
//           />
//         </MapView>
//       )}
//     </View>
//   );
// }
