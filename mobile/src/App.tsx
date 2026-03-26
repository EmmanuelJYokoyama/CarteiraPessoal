import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {AuthProvider, useAuth} from '@contexts/AuthContext';
import {AuthNavigator} from '@navigation/AuthNavigator';
import {AppNavigator} from '@navigation/AppNavigator';
import {ActivityIndicator, View} from 'react-native';

function RootNavigator() {
  const {isLoading, isSignedIn} = useAuth();

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
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}