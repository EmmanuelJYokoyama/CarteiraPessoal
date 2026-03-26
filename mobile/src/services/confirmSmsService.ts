import {useMemo, useState} from 'react';
import {confirmSms, resendSms} from '@services/api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function confirmSmsService(email: string, onSuccess: () => void) {
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const canSubmit = useMemo(
    () => code.trim().length === 6,
    [code],
  );

  async function handleConfirmSms() {
    if (!canSubmit || loading) return;

    try {
      setLoading(true);
      setErrorMessage('');

      const response = await confirmSms({
        email,
        code: code.trim(),
      });

      await AsyncStorage.setItem('@access_token', response.accessToken);
      await AsyncStorage.setItem('@refresh_token', response.refreshToken);
      await AsyncStorage.setItem('@user_data', JSON.stringify({
        name: response.name,
        email: response.email,
      }));

      onSuccess();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Código inválido ou expirado',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (resending) return;

    try {
      setResending(true);
      setErrorMessage('');

      await resendSms({email});

      setErrorMessage('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Erro ao reenviar código',
      );
    } finally {
      setResending(false);
    }
  }

  return {
    code,
    setCode,
    errorMessage,
    loading,
    resending,
    canSubmit,
    handleConfirmSms,
    handleResendCode,
  };
}
