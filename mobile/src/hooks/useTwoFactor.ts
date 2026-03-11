// src/modules/auth/services/useTwoFactor.ts
import {useRef, useState} from 'react';
import {TextInput, NativeSyntheticEvent, TextInputKeyPressEventData} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '@navigation/AuthNavigator';

export const CODE_LENGTH = 6;

export function maskPhone(phone: string): string {
  return phone.replace(/(\+?\d{2,3})\d+(\d{4})$/, '$1 ••••• $2');
}

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'TwoFactor'>;

export function useTwoFactor(phone: string, navigation: Navigation) {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const inputs = useRef<Array<TextInput | null>>(Array(CODE_LENGTH).fill(null));

  const maskedPhone = maskPhone(phone);
  const isFilled = code.every(d => d !== '');

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
    if (fullCode.length < CODE_LENGTH) {return;}
    // TODO: call verification API with fullCode
    navigation.replace('Pin');
  }

  function handleResend() {
    setCode(Array(CODE_LENGTH).fill(''));
    inputs.current[0]?.focus();
    // TODO: trigger resend API call
  }

  return {
    code,
    inputs,
    maskedPhone,
    isFilled,
    handleChange,
    handleKeyPress,
    handleVerify,
    handleResend,
  };
}
