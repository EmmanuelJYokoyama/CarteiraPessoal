import React, {useEffect} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {AuthProvider, useAuth} from '@contexts/AuthContext';
import {PermissionsProvider} from '@contexts/PermissionsContext';
import {AuthNavigator} from '@navigation/AuthNavigator';
import {AppNavigator} from '@navigation/AppNavigator';
import {ActivityIndicator, View} from 'react-native';
import {useOfflineSync} from '@hooks/useOfflineSync';
import {setTokenExpiredCallback} from '@services/api/client';

function RootNavigator() {
  const {isLoading, isSignedIn, signOut} = useAuth();
  const {isOnline} = useOfflineSync();

  // Registrar callback para quando o token expirar
  useEffect(() => {
    setTokenExpiredCallback(() => {
      console.log('[Auth] Token expired, signing out...');
      signOut();
    });
  }, [signOut]);

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1d3a6e'}}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  return isSignedIn ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PermissionsProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </PermissionsProvider>
    </SafeAreaProvider>
  );
}