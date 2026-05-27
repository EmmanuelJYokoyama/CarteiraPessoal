import React from 'react';
import {View} from 'react-native';
import {
  CartesianChart,
  Line,
} from 'victory-native';
import {ChartCard} from './ChartCard';
import type {ChartCardProps, ChartDatum} from './chartTypes';
import {chartColors, chartTheme} from '@config/chartTheme';

type Props = ChartCardProps & {
  data: ChartDatum[];
  yLabel?: string;
  xLabel?: string;
  showDots?: boolean;
};

export function LineChartCard({
  title,
  subtitle,
  data,
  yLabel,
  xLabel,
  showDots = true,
  height = 280,
}: Props) {
  const fallbackSubtitle = [xLabel, yLabel].filter(Boolean).join(' • ');
  const cardSubtitle = subtitle ?? (fallbackSubtitle || undefined);
  void showDots;
  return (
    <ChartCard title={title} subtitle={cardSubtitle} height={height}>
      <View style={{flex: 1}}>
        <CartesianChart
          data={data.map((entry, index) => ({
            x: entry.x,
            y: entry.y,
            color: entry.color || chartColors.primary,
            label: entry.label || `${entry.y}`,
            index,
          }))}
          xKey="x"
          yKeys={['y']}
          domainPadding={{left: 18, right: 18, top: 14, bottom: 14}}
          axisOptions={{
            lineColor: chartTheme.axisLine,
            labelColor: chartTheme.axisText,
            tickCount: 4,
            formatXLabel: value => `${value}`.slice(0, 10),
            formatYLabel: value => `${value}`,
          }}>
          {({points}) => (
            <Line
              points={points.y}
              color={chartColors.primary}
            />
          )}
        </CartesianChart>
      </View>
    </ChartCard>
  );
}
