"use client"

import {
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts'

interface SparklineChartProps {
  data: Record<string, unknown>[];
  dataKey: string;
  height?: number;
  width?: number;
  color?: string;
  strokeWidth?: number;
}

export function SparklineChart({
  data,
  dataKey,
  height = 40,
  width = 100,
  color = '#3b82f6',
  strokeWidth = 2
}: SparklineChartProps) {
  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={strokeWidth}
          dot={false}
          activeDot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}