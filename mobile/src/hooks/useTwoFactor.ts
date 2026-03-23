// src/modules/auth/services/useTwoFactor.ts
import {useEffect, useRef, useState} from 'react';
import {TextInput, NativeSyntheticEvent, TextInputKeyPressEventData} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '@navigation/AuthNavigator';

export const CODE_LENGTH = 6;
const OTP_EXPIRATION_SECONDS = 90;

export function maskPhone(phone: string): string {
  return phone.replace(/(\+?\d{2,3})\d+(\d{4})$/, '$1 ••••• $2');
}

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'TwoFactor'>;

export function useTwoFactor(phone: string, navigation: Navigation) {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRATION_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputs = useRef<Array<TextInput | null>>(Array(CODE_LENGTH).fill(null));

  const maskedPhone = maskPhone(phone);
  const isFilled = code.every(d => d !== '');
  const canResend = secondsLeft === 0 && !isResending;

  useEffect(() => {
    if (secondsLeft === 0) {
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [secondsLeft]);

  const timerLabel = `${Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, '0')}:${(secondsLeft % 60).toString().padStart(2, '0')}`;

  function handleChange(text: string, index: number) {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(
    {nativeEvent}: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) {
    if (nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handleVerify() {
    const fullCode = code.join('');
    if (fullCode.length < CODE_LENGTH || isVerifying) {
      return;
    }

    setErrorMessage('');
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      navigation.replace('Pin');
    }, 500);
  }

  function handleResend() {
    if (!canResend) {
      return;
    }

    setIsResending(true);
    setErrorMessage('');
    setCode(Array(CODE_LENGTH).fill(''));
    inputs.current[0]?.focus();

    setTimeout(() => {
      setSecondsLeft(OTP_EXPIRATION_SECONDS);
      setIsResending(false);
    }, 500);
  }

  return {
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
  };
}
