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
import {AppErrorBoundary} from '@components/common/AppErrorBoundary';
import {initializeTelemetry, logScreenView, setTelemetryUserId} from '@services/telemetry/firebaseTelemetry';

function getActiveRouteName(state: unknown): string | undefined {
  if (!state || typeof state !== 'object') {
    return undefined;
  }

  const typedState = state as {index?: number; routes?: Array<{name?: string; state?: unknown}>};
  const route = typedState.routes?.[typedState.index ?? 0];

  if (!route) {
    return undefined;
  }

  if (route.state) {
    return getActiveRouteName(route.state);
  }

  return route.name;
}

function RootNavigator() {
  const {isLoading, isSignedIn, signOut, user} = useAuth();
  useOfflineSync();
  const {hasCompletedOnboarding, isLoading: onboardingLoading, markOnboardingAsCompleted} = usePermissionsOnboarding();

  useEffect(() => {
    setTokenExpiredCallback(() => {
      console.log('[Auth] Token expired, signing out...');
      signOut();
    });
  }, [signOut]);

  useEffect(() => {
    void initializeTelemetry();
  }, []);

  useEffect(() => {
    void setTelemetryUserId(isSignedIn && user ? user.email : null);
  }, [isSignedIn, user]);

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
      <AppErrorBoundary>
        <PermissionsProvider>
          <AuthProvider>
            <GoalsProvider>
              <NavigationContainer
                onReady={() => {
                  void logScreenView('App');
                }}
                onStateChange={state => {
                  const currentRouteName = getActiveRouteName(state);
                  if (currentRouteName) {
                    void logScreenView(currentRouteName);
                  }
                }}>
                <RootNavigator />
              </NavigationContainer>
            </GoalsProvider>
          </AuthProvider>
        </PermissionsProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}