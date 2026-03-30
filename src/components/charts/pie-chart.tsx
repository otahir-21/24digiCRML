"use client";

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface PieChartProps {
  data: Record<string, unknown>[];
  dataKey: string;
  nameKey: string;
  height?: number;
  colors?: string[];
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  formatTooltip?: (value: number | string, name: string) => [string, string];
  renderLabel?: (entry: Record<string, unknown>) => string;
}

const defaultColors = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export function PieChart({
  data,
  dataKey,
  height = 300,
  colors = defaultColors,
  showLegend = true,
  innerRadius = 0,
  outerRadius = 80,
  formatTooltip,
  renderLabel,
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          dataKey={dataKey}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={formatTooltip}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
          labelStyle={{ color: "#374151" }}
        />
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{
              paddingTop: "20px",
              fontSize: "14px",
            }}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

export function DonutChart(props: Omit<PieChartProps, "innerRadius">) {
  return <PieChart {...props} innerRadius={60} />;
}
