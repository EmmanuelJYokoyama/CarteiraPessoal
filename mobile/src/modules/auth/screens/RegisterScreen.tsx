import React from 'react';
import {Pressable, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '@navigation/AuthNavigator';
import {AppTextField} from '@components/common/AppTextField';
import {AppButton}    from '@components/common/AppButton';
import {registerService} from '@services/registerService';
import {formatPhoneNumber} from '@utils/phoneFormatter';
import {styles} from './styles/LoginRegisterScreen.styles';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({navigation}: Props) {
  const {
    name,            setName,
    email,           setEmail,
    phoneNumber,     setPhoneNumber,
    password,        setPassword,
    confirmPassword, setConfirmPassword,
    errorMessage,
    loading,
    canSubmit,
    handleRegister,
  } = registerService((email) => navigation.navigate('ConfirmSms', {email}));

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhoneNumber(formatted);
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <Text style={styles.logoTitle}>CARTEIRA PESSOAL</Text>
        <Text style={styles.logoSubtitle}>Finanças Simples e Seguras</Text>
      </View>

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
          label="Telefone"
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          placeholder="+55 11 99999-9999"
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