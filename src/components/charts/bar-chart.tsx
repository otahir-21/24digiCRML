"use client"

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

interface BarChartProps {
  data: Record<string, unknown>[];
  dataKeys: string[];
  xAxisKey: string;
  height?: number;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  layout?: 'horizontal' | 'vertical';
  stacked?: boolean;
  formatTooltip?: (value: number | string, name: string | number) => [string, string];
  formatXAxis?: (value: number | string) => string;
  formatYAxis?: (value: number | string) => string;
}

const defaultColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export function BarChart({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  colors = defaultColors,
  showGrid = true,
  showLegend = true,
  layout = 'vertical',
  stacked = false,
  formatTooltip,
  formatXAxis,
  formatYAxis
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />}
        <XAxis
          type={layout === 'vertical' ? 'category' : 'number'}
          dataKey={layout === 'vertical' ? xAxisKey : undefined}
          tickFormatter={formatXAxis}
          className="text-sm fill-gray-500 dark:fill-gray-400"
        />
        <YAxis
          type={layout === 'vertical' ? 'number' : 'category'}
          dataKey={layout === 'horizontal' ? xAxisKey : undefined}
          tickFormatter={formatYAxis}
          className="text-sm fill-gray-500 dark:fill-gray-400"
        />
        <Tooltip
          formatter={formatTooltip ? (value, name) => formatTooltip(value as number | string, name as string | number) : undefined}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          labelStyle={{ color: '#374151' }}
        />
        {showLegend && <Legend />}
        {dataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[index % colors.length]}
            stackId={stacked ? 'stack' : undefined}
            radius={4}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}