import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '@modules/auth/screens/HomeScreen';
import SettingsScreen from '@modules/auth/screens/SettingsScreen';
import SetPinScreen from '@modules/auth/screens/SetPinScreen';
import CardsScreen from '@modules/cards/screens/CardsScreen';
import TransactionsScreen from '@modules/transactions/screens/TransactionsScreen';
import ImportStatementScreen from '@modules/transactions/screens/ImportStatementScreen';
import BudgetsScreen from '@modules/budgets/screens/BudgetsScreen';
import GoalsScreen from '@modules/goals/screens/GoalsScreen';
import InvestmentSimulatorScreen from '@modules/investments/screens/InvestmentSimulatorScreen';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: '#fff'},
      }}>
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
      />
      <Stack.Screen 
        name="SetPin" 
        component={SetPinScreen}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
      />
      <Stack.Screen 
        name="Cards" 
        component={CardsScreen}
      />
      <Stack.Screen 
        name="Transactions" 
        component={TransactionsScreen}
      />
      <Stack.Screen 
        name="ImportStatement" 
        component={ImportStatementScreen}
      />
      <Stack.Screen 
        name="Budgets" 
        component={BudgetsScreen}
      />
      <Stack.Screen 
        name="Goals" 
        component={GoalsScreen}
      />
      <Stack.Screen 
        name="Investments" 
        component={InvestmentSimulatorScreen}
      />
    </Stack.Navigator>
  );
}
