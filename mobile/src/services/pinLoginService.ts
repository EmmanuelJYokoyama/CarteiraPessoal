import {loginWithPin} from './api/pin';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

export interface PinLoginState {
  attempts: number;
  isLocked: boolean;
  lockoutTime: number;
  error: string;
}

export interface PinLoginResponse {
  success: boolean;
  state?: PinLoginState;
  error?: string;
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

export const handlePinLogin = async (
  email: string,
  pin: string
): Promise<PinLoginResponse> => {
  if (!isValidEmail(email)) {
    return {
      success: false,
      error: 'Email inválido',
    };
  }

  if (pin.length !== 4) {
    return {
      success: false,
      error: 'PIN deve ter 4 dígitos',
    };
  }

  // Check lockout status
  const {isLocked, lockoutTime, attempts} = await checkLockoutStatus();
  if (isLocked) {
    return {
      success: false,
      error: 'Muitas tentativas. Tente novamente em 5 minutos.',
      state: {attempts, isLocked, lockoutTime, error: ''},
    };
  }

  try {
    const response = await loginWithPin({email, pin});

    if (response.success && response.token) {
      // Reset attempts on success
      await AsyncStorage.removeItem('@pin_attempts');
      await AsyncStorage.removeItem('@pin_lockout');

      // Save token
      await AsyncStorage.setItem('@access_token', response.token);

      return {
        success: true,
        state: {attempts: 0, isLocked: false, lockoutTime: 0, error: ''},
      };
    } else {
      throw new Error('Login com PIN falhou');
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

        return {
          success: false,
          error: 'Muitas tentativas. Tente novamente em 5 minutos.',
          state: {
            attempts: newAttempts,
            isLocked: true,
            lockoutTime: LOCKOUT_DURATION / 1000,
            error: '',
          },
        };
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts;
        displayError =
          remaining === 1
            ? 'PIN incorreto. Última tentativa antes do bloqueio.'
            : `PIN incorreto. Tentativas restantes: ${remaining}`;

        return {
          success: false,
          error: displayError,
          state: {attempts: newAttempts, isLocked: false, lockoutTime: 0, error: displayError},
        };
      }
    }

    return {
      success: false,
      error: displayError,
    };
  }
};

export const clearPinLockout = async (): Promise<void> => {
  await AsyncStorage.removeItem('@pin_lockout');
  await AsyncStorage.removeItem('@pin_attempts');
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
