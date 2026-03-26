import React from 'react';
import {Pressable, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '@navigation/AuthNavigator';
import {AppTextField} from '@components/common/AppTextField';
import {AppButton}    from '@components/common/AppButton';
import {loginService} from '@services/loginService';
import {styles} from './styles/LoginRegisterScreen.styles';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({navigation}: Props) {
  const {
    email,        setEmail,
    password,     setPassword,
    errorMessage,
    loading,
    canSubmit,
    handleLogin,
  } = loginService(() => {
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Entrar na Carteira</Text>
        <Text style={styles.subtitle}>
          Acesse sua conta para ver cartões, metas e transações.
        </Text>

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

        <Pressable
          onPress={() => navigation.navigate('Register')}
          style={styles.linkWrapper}>
          <Text style={styles.linkText}>Ainda não tem conta? Cadastre-se</Text>
        </Pressable>
      </View>
    </View>
  );
}