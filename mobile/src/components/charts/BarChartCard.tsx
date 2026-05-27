import React from 'react';
import {View} from 'react-native';
import {Bar, CartesianChart} from 'victory-native';
import {ChartCard} from './ChartCard';
import type {ChartCardProps, ChartDatum} from './chartTypes';
import {chartColors, chartPalette, chartTheme} from '@config/chartTheme';

type Props = ChartCardProps & {
  data: ChartDatum[];
  xLabel?: string;
  yLabel?: string;
};

export function BarChartCard({title, subtitle, data, xLabel, yLabel, height = 280}: Props) {
  const fallbackSubtitle = [xLabel, yLabel].filter(Boolean).join(' • ');
  const cardSubtitle = subtitle ?? (fallbackSubtitle || undefined);

  return (
    <ChartCard title={title} subtitle={cardSubtitle} height={height}>
      <View style={{flex: 1}}>
        <CartesianChart
          data={data.map((entry, index) => ({
            x: entry.x,
            y: entry.y,
            color: entry.color || chartPalette[index % chartPalette.length],
            label: entry.label || `${entry.y}`,
          }))}
          xKey="x"
          yKeys={['y']}
          domainPadding={{left: 16, right: 16, top: 14, bottom: 14}}
          axisOptions={{
            lineColor: chartTheme.axisLine,
            labelColor: chartTheme.axisText,
            tickCount: 4,
            formatXLabel: value => `${value}`.slice(0, 10),
            formatYLabel: value => `${value}`,
          }}>
          {({points, chartBounds}) => (
            <Bar
              points={points.y}
              chartBounds={chartBounds}
              color={chartColors.secondary}
            />
          )}
        </CartesianChart>
      </View>
    </ChartCard>
  );
}
