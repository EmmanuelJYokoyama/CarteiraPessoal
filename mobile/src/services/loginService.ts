import {useMemo, useState} from 'react';
import {login} from '@services/api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function loginService(onSuccess: () => void) {
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading,      setLoading]      = useState(false);

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.trim().length >= 6,
    [email, password],
  );

  async function handleLogin() {
    if (!canSubmit || loading) return;

    try {
      setLoading(true);
      setErrorMessage('');

      const response = await login({
        email: email.trim(),
        password,
      });

      await AsyncStorage.setItem('@access_token',  response.accessToken);
      await AsyncStorage.setItem('@refresh_token', response.refreshToken);
      await AsyncStorage.setItem('@user_data', JSON.stringify({
        name: response.name,
        email: response.email,
      }));

      onSuccess();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Não foi possível entrar',
      );
    } finally {
      setLoading(false);
    }
  }

  return {
    email,        setEmail,
    password,     setPassword,
    errorMessage,
    loading,
    canSubmit,
    handleLogin,
  };
}