// src/modules/auth/screens/LoginScreen.tsx
import React, {useMemo, useState} from 'react';
import {Alert, Pressable, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '@navigation/AuthNavigator';
import {AppTextField} from '@components/common/AppTextField';
import {AppButton} from '@components/common/AppButton';
import {login} from '@services/api/auth';
import {styles} from './styles/LoginScreen.styles';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({navigation}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length >= 6;
  }, [email, password]);

  async function handleLogin() {
    if (!canSubmit || loading) {
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const result = await login({
        email: email.trim(),
        password,
      });

      Alert.alert('Login realizado', `Access token: ${result.accessToken.slice(0, 14)}...`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível entrar';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Registre-se</Text>
        <Text style={styles.subtitle}>Acesse sua conta para ver cartões, metas e transações.</Text>

        <AppTextField
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          editable={!loading}
        />

        <AppTextField
          label="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          editable={!loading}
          error={errorMessage || undefined}
        />

        <AppButton
          title="Entrar"
          onPress={handleLogin}
          disabled={!canSubmit}
          loading={loading}
        />

        <Pressable onPress={() => navigation.navigate('Register')} style={styles.linkWrapper}>
          <Text style={styles.linkText}>Ainda não tem conta? Cadastre-se</Text>
        </Pressable>
      </View>
    </View>
  );
}
