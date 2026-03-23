// src/modules/auth/screens/TwoFactorScreen.tsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '@navigation/AuthNavigator';
import {styles} from './styles/TwoFactorScreen.styles';
import {useTwoFactor} from '@hooks/useTwoFactor';

type Props = NativeStackScreenProps<AuthStackParamList, 'TwoFactor'>;

export default function TwoFactorScreen({route, navigation}: Props) {
  const {phone} = route.params;
  const {
    code,
    inputs,
    maskedPhone,
    isFilled,
    timerLabel,
    isVerifying,
    isResending,
    canResend,
    errorMessage,
    handleChange,
    handleKeyPress,
    handleVerify,
    handleResend,
  } = useTwoFactor(phone, navigation);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <Text style={styles.title}>Verificação em duas etapas</Text>
        <Text style={styles.subtitle}>
          Insira o código de 6 dígitos enviado para{'\n'}
          <Text style={styles.phone}>{maskedPhone}</Text>
        </Text>

        <View style={styles.codeRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={el => {
                inputs.current[i] = el;
              }}
              style={[styles.digitBox, digit ? styles.digitBoxFilled : null]}
              value={digit}
              onChangeText={text => handleChange(text, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              selectTextOnFocus
              caretHidden
            />
          ))}
        </View>

        <Text style={styles.timerText}>Expira em {timerLabel}</Text>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <TouchableOpacity
          style={[styles.button, !isFilled && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={!isFilled || isVerifying}
          activeOpacity={0.8}>
          <Text style={styles.buttonText}>{isVerifying ? 'Validando...' : 'Verificar'}</Text>
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Não recebeu o código? </Text>
          <TouchableOpacity onPress={handleResend} disabled={!canResend || isResending}>
            <Text style={[styles.resendLink, (!canResend || isResending) && styles.resendDisabled]}>
              {isResending ? 'Reenviando...' : 'Reenviar'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
