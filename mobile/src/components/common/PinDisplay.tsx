import React from 'react';
import {View} from 'react-native';
import {styles} from './styles/PinDisplay.styles';

interface PinDisplayProps {
  value: string;
  length?: number;
  error?: boolean;
}

export function PinDisplay({value, length = 4, error = false}: PinDisplayProps) {
  const dots = Array.from({length}).map((_, i) => ({
    filled: i < value.length,
    index: i,
  }));

  return (
    <View style={styles.container}>
      {dots.map(dot => (
        <View
          key={dot.index}
          style={[
            styles.dot,
            dot.filled && styles.dotFilled,
            error && styles.dotError,
          ]}
        />
      ))}
    </View>
  );
}
