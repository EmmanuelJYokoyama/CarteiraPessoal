import React, {useRef} from 'react';
import {Pressable, Text, TextInput, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '@navigation/AuthNavigator';
import {AppButton} from '@components/common/AppButton';
import {useConfirmSmsService} from '@services/confirmSmsService';
import {styles} from './styles/ConfirmSmsScreen.styles';

type Props = NativeStackScreenProps<AuthStackParamList, 'ConfirmSms'>;

export default function ConfirmSmsScreen({route, navigation}: Props) {
  const {email} = route.params;
  const inputRef = useRef<TextInput>(null);

  const {
    code,
    setCode,
    errorMessage,
    loading,
    resending,
    canSubmit,
    handleConfirmSms,
    handleResendCode,
  } = useConfirmSmsService(email);

  const handleCodeChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(numericValue);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Verificar Telefone</Text>
        <Text style={styles.subtitle}>
          Confirmamos que é você na sua conta
        </Text>
        
        <Text style={styles.description}>
          Enviamos um código de verificação para seu telefone. Digite os 6 dígitos abaixo.
        </Text>

        <View style={styles.codeInputWrapper}>
          <Text style={styles.codeLabel}>Código de verificação</Text>
          
          <View style={styles.codeInputContainer}>
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              editable={!loading}
              style={[
                styles.codeInput,
                errorMessage ? styles.codeInputError : null,
              ]}
            />
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
        </View>

        <AppButton
          title="Confirmar"
          onPress={handleConfirmSms}
          disabled={!canSubmit || loading}
          loading={loading}
        />

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Não recebeu o código?</Text>
          <Pressable
            onPress={handleResendCode}
            disabled={resending}
            style={[
              styles.resendButton,
              resending ? styles.resendButtonDisabled : null,
            ]}>
            <Text style={styles.resendButtonText}>
              {resending ? 'Reenviando...' : 'Reenviar'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Register')}
          style={styles.linkWrapper}>
          <Text style={styles.linkText}>Usar outro telefone? Voltar</Text>
        </Pressable>
      </View>
    </View>
  );
}
