import React, {useEffect} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {AuthProvider, useAuth} from '@contexts/AuthContext';
import {PermissionsProvider} from '@contexts/PermissionsContext';
import {AuthNavigator} from '@navigation/AuthNavigator';
import {AppNavigator} from '@navigation/AppNavigator';
import {ActivityIndicator, View} from 'react-native';
import {useOfflineSync} from '@hooks/useOfflineSync';
import {usePermissionsOnboarding} from '@hooks/usePermissionsOnboarding';
import {setTokenExpiredCallback} from '@services/api/client';
import {PermissionsOnboardingScreen} from '@modules/auth/screens/PermissionsOnboardingScreen';

function RootNavigator() {
  const {isLoading, isSignedIn, signOut} = useAuth();
  const {isOnline} = useOfflineSync();
  const {hasCompletedOnboarding, isLoading: onboardingLoading, markOnboardingAsCompleted} = usePermissionsOnboarding();

  // Registrar callback para quando o token expirar
  useEffect(() => {
    setTokenExpiredCallback(() => {
      console.log('[Auth] Token expired, signing out...');
      signOut();
    });
  }, [signOut]);

  if (isLoading || onboardingLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1d3a6e'}}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  // Se usuário está autenticado mas não completou o onboarding de permissões
  if (isSignedIn && !hasCompletedOnboarding) {
    return (
      <PermissionsOnboardingScreen
        onComplete={async () => {
          await markOnboardingAsCompleted();
        }}
      />
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