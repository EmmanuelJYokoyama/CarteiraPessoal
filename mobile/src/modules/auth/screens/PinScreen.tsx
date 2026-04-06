import React, {useState, useEffect, useRef} from 'react';
import {View, Text, Pressable, TextInput} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  usePinLogin,
  checkLockoutStatus,
  formatTime,
} from '@services/pinLoginService';
import {styles} from './styles/PinScreen.styles';

type Props = NativeStackScreenProps<any, 'PinLogin'>;

export default function PinScreen({navigation}: Props) {
  const {
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
  } = usePinLogin();

  const emailInputRef = useRef<TextInput>(null);
  const pinInputRef = useRef<TextInput>(null);

  // Check for lockout on mount
  useEffect(() => {
    const init = async () => {
      const {isLocked: locked, lockoutTime: time} = await checkLockoutStatus();
      setIsLocked(locked);
      setLockoutTime(time);
    };
    init();
  }, [setIsLocked, setLockoutTime]);

  // Countdown timer for lockout
  useEffect(() => {
    if (!isLocked || lockoutTime <= 0) return;

    const timer = setInterval(() => {
      setLockoutTime(prev => {
        if (prev <= 1) {
          setIsLocked(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockoutTime, setLockoutTime, setIsLocked]);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setError('');
  };

  const handlePinChange = (text: string) => {
    if (isLocked || loading) return;
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 4);
    setPin(numericText);
    setError('');
  };

  const handleSubmit = async () => {
    if (loading || isLocked) return;
    await handlePinLogin();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={styles.headerBack}>← Voltar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Login com PIN</Text>
        <View style={{width: 60}} />
      </SafeAreaView>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Digite seu email e PIN de 4 dígitos</Text>

        {/* Email Input */}
        <TextInput
          ref={emailInputRef}
          style={styles.emailInput}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={handleEmailChange}
          placeholder="seu@email.com"
          placeholderTextColor="#999"
          editable={!isLocked && !loading}
          onSubmitEditing={() => pinInputRef.current?.focus()}
        />

        {/* PIN Display */}
        <Pressable onPress={() => pinInputRef.current?.focus()}>
          <View style={styles.pinDisplay}>
            {[0, 1, 2, 3].map(i => (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  i < pin.length && styles.pinDotFilled,
                  error && styles.pinDotError,
                ]}
              />
            ))}
          </View>
        </Pressable>


        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {isLocked && (
          <Text style={styles.lockoutText}>
            ⏱ Tente novamente em {formatTime(lockoutTime)}
          </Text>
        )}

        {/* Native Keyboard Input */}
        <TextInput
          ref={pinInputRef}
          style={styles.hiddenInput}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry={true}
          value={pin}
          onChangeText={handlePinChange}
          placeholder="0000"
          placeholderTextColor="#999"
          editable={!isLocked && !loading}
          autoFocus={true}
        />

        <View style={styles.actions}>
          <Pressable
            style={({pressed}) => [
              styles.button,
              styles.buttonPrimary,
              pressed && styles.buttonPrimaryPressed,
              (!isValidEmail(email) || pin.length !== 4 || isLocked || loading) &&
                styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isValidEmail(email) || pin.length !== 4 || isLocked || loading}>
            <Text style={styles.buttonTextPrimary}>
              {loading ? 'Verificando...' : 'Entrar'}
            </Text>
          </Pressable>
        </View>
        </View>
      </View>
  );
}
