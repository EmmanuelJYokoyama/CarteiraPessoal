import React from 'react';
import {Text, TextInput, TextInputProps, View} from 'react-native';
import {styles} from './AppTextField.styles';

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function AppTextField({label, error, ...inputProps}: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#666"
        style={[styles.input, error ? styles.inputError : null]}
        {...inputProps}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}