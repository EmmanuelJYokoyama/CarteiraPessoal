import React from 'react';
import {View, Pressable, Text} from 'react-native';
import {styles} from './NumericKeyboard.styles';

interface NumericKeyboardProps {
  onNumberPress: (number: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}

export function NumericKeyboard({
  onNumberPress,
  onBackspace,
  disabled = false,
}: NumericKeyboardProps) {
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0'];

  return (
    <View style={styles.keyboard}>
      {numbers.map((number, index) => {
        if (number === '') {
          return <View key={index} style={styles.emptyKey} />;
        }

        return (
          <Pressable
            key={index}
            onPress={() => !disabled && onNumberPress(number)}
            style={({pressed}) => [
              styles.key,
              pressed && !disabled && styles.keyPressed,
              disabled && styles.keyDisabled,
            ]}>
            <Text style={styles.keyText}>{number}</Text>
          </Pressable>
        );
      })}

      <Pressable
        onPress={onBackspace}
        disabled={disabled}
        style={({pressed}) => [
          styles.key,
          styles.backspaceKey,
          pressed && !disabled && styles.keyPressed,
          disabled && styles.keyDisabled,
        ]}>
        <Text style={styles.keyText}>⌫</Text>
      </Pressable>
    </View>
  );
}
