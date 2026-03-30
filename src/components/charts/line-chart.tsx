"use client"

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

interface LineChartProps {
  data: Record<string, unknown>[];
  dataKeys: string[];
  xAxisKey: string;
  height?: number;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  strokeWidth?: number;
  formatTooltip?: (value: number | string, name: string | number) => [string, string];
  formatXAxis?: (value: number | string) => string;
  formatYAxis?: (value: number | string) => string;
}

const defaultColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export function LineChart({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  colors = defaultColors,
  showGrid = true,
  showLegend = true,
  strokeWidth = 2,
  formatTooltip,
  formatXAxis,
  formatYAxis
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />}
        <XAxis
          dataKey={xAxisKey}
          tickFormatter={formatXAxis}
          className="text-sm fill-gray-500 dark:fill-gray-400"
        />
        <YAxis
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
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[index % colors.length]}
            strokeWidth={strokeWidth}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}