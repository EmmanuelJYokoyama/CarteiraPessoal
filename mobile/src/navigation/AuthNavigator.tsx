// src/navigation/AuthNavigator.tsx
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import LoginScreen from '@modules/auth/screens/LoginScreen';
import RegisterScreen from '@modules/auth/screens/RegisterScreen';
import TwoFactorScreen from '@modules/auth/screens/TwoFactorScreen';
// import PinScreen from '@modules/auth/screens/PinScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  TwoFactor: {phone: string};
  Pin: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {backgroundColor: '#fff'},
      }}>
      <Stack.Screen name="Login"     component={LoginScreen} />
      <Stack.Screen name="Register"  component={RegisterScreen} />
      <Stack.Screen name="TwoFactor" component={TwoFactorScreen} />
      {/* <Stack.Screen name="Pin"       component={PinScreen} /> */}
    </Stack.Navigator>
  );
}