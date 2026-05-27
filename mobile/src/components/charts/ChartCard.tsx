import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {chartColors} from '@config/chartTheme';
import type {ChartCardProps} from './chartTypes';

type Props = React.PropsWithChildren<ChartCardProps>;

export function ChartCard({title, subtitle, height = 280, children}: Props) {
  return (
    <View style={[styles.card, {minHeight: height}] }>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: chartColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: chartColors.border,
    padding: 16,
  },
  header: {
    marginBottom: 12,
    gap: 4,
  },
  title: {
    color: chartColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: chartColors.mutedText,
    fontSize: 12,
  },
  body: {
    flex: 1,
  },
});
