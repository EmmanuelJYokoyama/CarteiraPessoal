import React, {useEffect} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {AuthProvider, useAuth} from '@contexts/AuthContext';
import {GoalsProvider} from '@contexts/GoalsContext';
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
          <GoalsProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </GoalsProvider>
        </AuthProvider>
      </PermissionsProvider>
    </SafeAreaProvider>
  );
}