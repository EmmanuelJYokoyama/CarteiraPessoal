import React from 'react';
import {View} from 'react-native';
import {CartesianChart, BarGroup} from 'victory-native';
import {ChartCard} from './ChartCard';
import {chartPalette, chartColors} from '@config/chartTheme';

type GroupedDatum = {
  x: string | number;
  income: number;
  expense: number;
  colorIncome?: string;
  colorExpense?: string;
};

type Props = {
  title: string;
  subtitle?: string;
  data: GroupedDatum[];
  height?: number;
};

export function GroupedBarCard({title, subtitle, data, height = 280}: Props) {
  const cardSubtitle = subtitle;
  return (
    <ChartCard title={title} subtitle={cardSubtitle} height={height}>
      <View style={{flex: 1}}>
        <CartesianChart
          data={data.map(d => ({...d}))}
          xKey="x"
          yKeys={["income", "expense"]}
          domainPadding={{left: 12, right: 12, top: 12, bottom: 12}}
          axisOptions={{
            lineColor: chartColors.axis || '#e5e7eb',
            labelColor: chartColors.mutedText,
            tickCount: 6,
          }}>
          {({points, chartBounds}) => (
            <BarGroup chartBounds={chartBounds} betweenGroupPadding={0.3} withinGroupPadding={0.1}>
              <BarGroup.Bar points={points.income} color={chartPalette[0] || '#10b981'} />
              <BarGroup.Bar points={points.expense} color={chartPalette[3] || '#ef4444'} />
            </BarGroup>
          )}
        </CartesianChart>
      </View>
    </ChartCard>
  );
}

export default GroupedBarCard;
