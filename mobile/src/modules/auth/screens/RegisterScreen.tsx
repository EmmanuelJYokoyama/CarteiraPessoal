import React from 'react';
import {Pressable, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '@navigation/AuthNavigator';
import {AppTextField} from '@components/common/AppTextField';
import {AppButton}    from '@components/common/AppButton';
import {registerService} from '@services/registerService';
import {styles} from './styles/LoginRegisterScreen.styles';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({navigation}: Props) {
  const {
    name,         setName,
    email,        setEmail,
    password,     setPassword,
    confirmPassword, setConfirmPassword,
    errorMessage,
    loading,
    canSubmit,
    handleRegister,
  } = registerService(() => navigation.replace('Login'));

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>
          Cadastre-se para começar a organizar sua vida financeira.
        </Text>

        <AppTextField
          label="Nome"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={!loading}
        />

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
        />

        <AppTextField
          label="Confirmar senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          editable={!loading}
          error={errorMessage || undefined}
        />

        <AppButton
          title="Cadastrar"
          onPress={handleRegister}
          disabled={!canSubmit}
          loading={loading}
        />

        <Pressable
          onPress={() => navigation.navigate('Login')}
          style={styles.linkWrapper}>
          <Text style={styles.linkText}>Já tem conta? Entrar</Text>
        </Pressable>
      </View>
    </View>
  );
}