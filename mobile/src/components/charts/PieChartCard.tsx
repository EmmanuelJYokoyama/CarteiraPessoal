import React from 'react';
import {View} from 'react-native';
import {Pie, PolarChart} from 'victory-native';
import {ChartCard} from './ChartCard';
import type {ChartCardProps, ChartDatum} from './chartTypes';
import {chartPalette} from '@config/chartTheme';

type Props = ChartCardProps & {
  data: ChartDatum[];
  innerRadius?: number;
};

export function PieChartCard({title, subtitle, data, innerRadius = 52, height = 280}: Props) {
  return (
    <ChartCard title={title} subtitle={subtitle} height={height}>
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <PolarChart
          data={data.map((entry, index) => ({
            label: String(entry.label ?? entry.x),
            value: entry.y,
            color: entry.color || chartPalette[index % chartPalette.length],
          }))}
          colorKey="color"
          labelKey="label"
          valueKey="value"
          canvasStyle={{height}}>
          <Pie.Chart innerRadius={innerRadius} size={Math.min(220, height - 50)}>
            {() => <Pie.Slice animate={{type: 'timing', duration: 700}} />}
          </Pie.Chart>
        </PolarChart>
      </View>
    </ChartCard>
  );
}
