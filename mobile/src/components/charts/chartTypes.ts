export type ChartDatum = {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
};

export type ChartCardProps = {
  title: string;
  subtitle?: string;
  height?: number;
};
