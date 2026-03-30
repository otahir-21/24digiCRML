"use client"

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

interface AreaChartProps {
  data: Record<string, unknown>[];
  dataKeys: string[];
  xAxisKey: string;
  height?: number;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  formatTooltip?: (value: number | string, name: string | number) => [string, string];
  formatXAxis?: (value: number | string) => string;
  formatYAxis?: (value: number | string) => string;
}

const defaultColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export function AreaChart({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  colors = defaultColors,
  showGrid = true,
  showLegend = true,
  stacked = false,
  formatTooltip,
  formatXAxis,
  formatYAxis
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          {dataKeys.map((key, index) => (
            <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.8} />
              <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
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
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId={stacked ? 'stack' : undefined}
            stroke={colors[index % colors.length]}
            fill={`url(#gradient-${key})`}
            strokeWidth={2}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}