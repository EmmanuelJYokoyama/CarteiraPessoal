import React, {useState, useRef} from 'react';
import {View, Text, Pressable, Alert, ActivityIndicator, TextInput} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {setPin} from '@services/api/pin';
import {styles} from './styles/SetPinScreen.styles';

type Props = NativeStackScreenProps<any, 'SetPin'>;

type Stage = 'initial' | 'confirm';

export default function SetPinScreen({navigation}: Props) {
  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPinValue] = useState('');
  const [stage, setStage] = useState<Stage>('initial');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);
  const confirmInputRef = useRef<TextInput>(null);

  const handlePinChange = (value: string) => {
    // Allow only numeric input and max 4 digits
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 4);
    if (stage === 'initial') {
      setPinValue(numericValue);
      setError('');
    }
  };

  const handleConfirmPinChange = (value: string) => {
    // Allow only numeric input and max 4 digits
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 4);
    setConfirmPinValue(numericValue);
    setError('');
  };

  const handleNext = () => {
    if (pin.length !== 4) {
      setError('PIN deve ter 4 dígitos');
      return;
    }
    setStage('confirm');
    setError('');
  };

  const handleConfirm = async () => {
    if (confirmPin.length !== 4) {
      setError('PIN deve ter 4 dígitos');
      return;
    }

    if (pin !== confirmPin) {
      setError('Os PINs não conferem');
      setConfirmPinValue('');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await setPin({pin});

      Alert.alert('Sucesso', 'PIN definido com sucesso!', [
        {text: 'OK', onPress: () => navigation.navigate('Home' as any)},
      ]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao definir PIN');
    } finally {
      setLoading(false);
    }
  };

  const currentPin = stage === 'initial' ? pin : confirmPin;
  const currentLabel = stage === 'initial' ? 'Defina um novo PIN' : 'Confirme seu PIN';

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Configurar PIN</Text>
        <View style={styles.headerSpacer} />
      </SafeAreaView>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.description}>
          O PIN é uma camada extra de segurança para suas transações. Use 4 dígitos.
        </Text>

        <Text style={styles.label}>{currentLabel}</Text>

        {/* PIN Display */}
        <View style={styles.pinDisplay}>
          {[0, 1, 2, 3].map(i => (
            <View
              key={i}
              style={[
                styles.pinDot,
                i < currentPin.length && styles.pinDotFilled,
              ]}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* PIN Input */}
        {stage === 'initial' ? (
          <TextInput
            ref={inputRef}
            style={styles.pinInput}
            value={pin}
            onChangeText={handlePinChange}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry={true}
            placeholder="••••"
            placeholderTextColor="#999"
            editable={!loading}
            autoFocus
          />
        ) : (
          <TextInput
              ref={confirmInputRef}
              style={styles.pinInput}
              value={confirmPin}
              onChangeText={handleConfirmPinChange}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry={true}
              placeholder="••••"
              placeholderTextColor="#999"
              editable={!loading}
              autoFocus
            />
          )}

          {currentPin.length === 4 && (
            <Pressable
              style={[styles.actionButton, loading && styles.actionButtonDisabled]}
              onPress={stage === 'initial' ? handleNext : handleConfirm}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.actionButtonText}>
                  {stage === 'initial' ? 'Próximo' : 'Confirmar PIN'}
                </Text>
              )}
            </Pressable>
          )}
      </View>
    </View>
  );
}
