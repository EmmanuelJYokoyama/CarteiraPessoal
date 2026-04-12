import React, {useState, useEffect} from 'react';
import {View, Text, Pressable, Alert, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {usePinLogin, checkLockoutStatus, formatTime} from '@services/pinLoginService';
import {NumericKeyboard} from '@components/common/NumericKeyboard';
import {PinDisplay} from '@components/common/PinDisplay';
import {useAuth} from '@contexts/AuthContext';
import {styles} from '../screens/styles/PinLoginScreen.styles';

type Props = NativeStackScreenProps<any, 'PinLogin'>;

export default function PinLoginScreen({navigation}: Props) {
  const {pin, setPin, error, setError, loading, isLocked, lockoutTime, setLockoutTime, setIsLocked} =
    usePinLogin();
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(true);
  const [countdownTimer, setCountdownTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const init = async () => {
      const {isLocked: locked, lockoutTime: time} = await checkLockoutStatus();
      setIsLocked(locked);
      setLockoutTime(time);
    };
    init();
  }, [setIsLocked, setLockoutTime]);

  useEffect(() => {
    if (!isLocked || lockoutTime <= 0) {
      if (countdownTimer) clearInterval(countdownTimer);
      return;
    }

    const timer = setInterval(() => {
      setLockoutTime(prev => {
        if (prev <= 1) {
          setIsLocked(false);
          if (countdownTimer) clearInterval(countdownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setCountdownTimer(timer);

    return () => clearInterval(timer);
  }, [isLocked, lockoutTime, setLockoutTime, setIsLocked, countdownTimer]);

  const isValidEmail = (text: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

  const handleNumberPress = (number: string) => {
    if (pin.length < 4) {
      setPin(pin + number);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleSubmit = async () => {
    if (
      !showEmailInput ||
      !isValidEmail(email) ||
      pin.length !== 4 ||
      loading ||
      isLocked
    ) {
      return;
    }

    try {
      Alert.alert('Sucesso', `Login com PIN: ${email} - ${pin}`);
    } catch (err) {
      setError('PIN incorreto. Tente novamente.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Login')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Login Rápido</Text>
        <View style={{width: 60}} />
      </View>

      <View style={styles.content}>
        {showEmailInput ? (
          <>
            <Text style={styles.stepTitle}>Informe seu e-mail</Text>
            <Text style={styles.stepSubtitle}>Usaremos para verificar sua identidade</Text>

            <View style={styles.emailInputWrapper}>
              <Text style={styles.label}>E-mail</Text>
              <View style={[styles.emailInput, !isValidEmail(email) && email && styles.emailInputError]}>
                <Text
                  style={[
                    styles.emailInputText,
                    !email && styles.emailInputPlaceholder,
                  ]}>
                  {email || 'seu@email.com'}
                </Text>
                {email && isValidEmail(email) && (
                  <Text style={styles.emailValidIcon}>✓</Text>
                )}
              </View>
              <Pressable
                style={({pressed}) => [
                  styles.button,
                  styles.buttonPrimary,
                  pressed && styles.buttonPrimaryPressed,
                  !isValidEmail(email) && styles.buttonDisabled,
                ]}
                onPress={() => setShowEmailInput(false)}
                disabled={!isValidEmail(email)}>
                <Text style={styles.buttonTextPrimary}>Próximo</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View>
              <Text style={styles.stepTitle}>Digite seu PIN</Text>
              <Text style={styles.stepSubtitle}>4 dígitos de segurança</Text>
              <Text style={styles.emailConfirm}>{email}</Text>
            </View>

            <PinDisplay value={pin} length={4} error={!!error} />

            {error && <Text style={styles.errorText}>{error}</Text>}

            {isLocked && (
              <View style={styles.lockoutBox}>
                <Text style={styles.lockoutText}>
                  ⏱ Muitas tentativas incorretas
                </Text>
                <Text style={styles.lockoutTime}>Tente novamente em {formatTime(lockoutTime)}</Text>
              </View>
            )}

            {!isLocked && pin.length > 0 && (
              <Text style={styles.hintsText}>Digite um PIN de 4 dígitos</Text>
            )}

            <NumericKeyboard
              onNumberPress={handleNumberPress}
              onBackspace={handleBackspace}
              disabled={isLocked || loading}
            />

            <View style={styles.actionsContainer}>
              <Pressable
                style={({pressed}) => [
                  styles.button,
                  styles.buttonSecondary,
                  pressed && styles.buttonSecondaryPressed,
                ]}
                onPress={() => {
                  setShowEmailInput(true);
                  setPin('');
                  setError('');
                }}>
                <Text style={styles.buttonTextSecondary}>Alterar E-mail</Text>
              </Pressable>

              <Pressable
                style={({pressed}) => [
                  styles.button,
                  styles.buttonPrimary,
                  pressed && !loading && !isLocked && styles.buttonPrimaryPressed,
                  pin.length !== 4 && styles.buttonDisabled,
                  loading && styles.buttonLoading,
                ]}
                onPress={handleSubmit}
                disabled={pin.length !== 4 || loading || isLocked}>
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.buttonTextPrimary}>Entrar</Text>
                )}
              </Pressable>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function isValidEmail(text: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}
