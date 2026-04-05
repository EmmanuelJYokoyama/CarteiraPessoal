import {useState} from 'react';
import {loginWithPin} from './api/pin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '@contexts/AuthContext';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const checkLockoutStatus = async (): Promise<{
  isLocked: boolean;
  lockoutTime: number;
  attempts: number;
}> => {
  const lockoutTimestamp = await AsyncStorage.getItem('@pin_lockout');
  let isLocked = false;
  let lockoutTime = 0;

  if (lockoutTimestamp) {
    const remaining = parseInt(lockoutTimestamp) - Date.now();
    if (remaining > 0) {
      isLocked = true;
      lockoutTime = Math.ceil(remaining / 1000);
    } else {
      await AsyncStorage.removeItem('@pin_lockout');
      await AsyncStorage.removeItem('@pin_attempts');
    }
  }

  const storedAttempts = await AsyncStorage.getItem('@pin_attempts');
  const attempts = storedAttempts ? parseInt(storedAttempts) : 0;

  return {isLocked, lockoutTime, attempts};
};

export function usePinLogin() {
  const {signIn} = useAuth();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  const handlePinLogin = async () => {
    if (!isValidEmail(email)) {
      setError('Email inválido');
      return;
    }

    if (pin.length !== 4) {
      setError('PIN deve ter 4 dígitos');
      return;
    }

    // Check lockout status
    const {isLocked: locked, lockoutTime: time, attempts: att} = await checkLockoutStatus();
    if (locked) {
      setError('Muitas tentativas. Tente novamente em 5 minutos.');
      setIsLocked(true);
      setLockoutTime(time);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await loginWithPin({email, pin});

      if (response.success && response.token) {
        // Reset attempts on success
        await AsyncStorage.removeItem('@pin_attempts');
        await AsyncStorage.removeItem('@pin_lockout');
        await signIn(response.token, '', {
          email: email,
          name: response.user.name,
        });

        setEmail('');
        setPin('');
        setAttempts(0);
        setIsLocked(false);
      } else {
        setError('Login com PIN falhou');
      }
    } catch (err: any) {
      console.error('PIN Login Error:', err);

      const errorMsg = err.message || 'Erro ao fazer login';
      let displayError = errorMsg;

      if (
        errorMsg.includes('usuário') ||
        errorMsg.includes('não encontrado') ||
        errorMsg.includes('404')
      ) {
        displayError = 'Email não registrado';
      } else if (errorMsg.includes('não configurado')) {
        displayError = 'PIN não configurado para este usuário';
      } else if (errorMsg.includes('incorreto') || errorMsg.includes('401')) {
        const newAttempts = attempts + 1;
        await AsyncStorage.setItem('@pin_attempts', newAttempts.toString());

        if (newAttempts >= MAX_ATTEMPTS) {
          const lockoutTimestamp = Date.now() + LOCKOUT_DURATION;
          await AsyncStorage.setItem('@pin_lockout', lockoutTimestamp.toString());

          setError('Muitas tentativas. Tente novamente em 5 minutos.');
          setIsLocked(true);
          setLockoutTime(LOCKOUT_DURATION / 1000);
        } else {
          const remaining = MAX_ATTEMPTS - newAttempts;
          displayError =
            remaining === 1
              ? 'PIN incorreto. Última tentativa antes do bloqueio.'
              : `PIN incorreto. Tentativas restantes: ${remaining}`;

          setError(displayError);
          setAttempts(newAttempts);
        }
      } else {
        setError(displayError);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    pin,
    setPin,
    error,
    setError,
    loading,
    attempts,
    isLocked,
    lockoutTime,
    setLockoutTime,
    setIsLocked,
    handlePinLogin,
  };
}
