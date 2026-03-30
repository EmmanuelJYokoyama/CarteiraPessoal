import React from 'react';
import {View, Text, ViewStyle} from 'react-native';

type IconName = 
  | 'lock' | 'info' | 'package' | 'chevron-right' | 'arrow-left' 
  | 'eye' | 'eye-off' | 'check' | 'mail' | 'key' | 'home' | 'settings' | 'logout';

export type {IconName};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const ICON_SYMBOLS: Record<IconName, string> = {
  'lock': '🔒',
  'info': 'ℹ',
  'package': '📦',
  'chevron-right': '›',
  'arrow-left': '←',
  'eye': '👁',
  'eye-off': '🚫',
  'check': '✓',
  'mail': '✉',
  'key': '🔑',
  'home': '🏠',
  'settings': '⚙',
  'logout': '←',
};

export function Icon({name, size = 24, color = '#fff', style}: IconProps) {
  const symbol = ICON_SYMBOLS[name];
  
  return (
    <Text
      style={[
        {
          fontSize: size,
          color: color,
        },
        style,
      ]}>
      {symbol}
    </Text>
  );
}
