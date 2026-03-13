import React from 'react';
import {Pressable, StyleSheet, Text, ViewStyle} from 'react-native';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function AppButton({title, onPress, disabled = false, loading = false, style}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({pressed}) => [
        styles.button,
        isDisabled ? styles.buttonDisabled : null,
        pressed && !isDisabled ? styles.buttonPressed : null,
        style,
      ]}>
      <Text style={styles.buttonText}>{loading ? 'Entrando...' : title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f766e',
  },
  buttonDisabled: {
    backgroundColor: '#99d7d1',
  },
  buttonPressed: {
    transform: [{scale: 0.99}],
    opacity: 0.92,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});