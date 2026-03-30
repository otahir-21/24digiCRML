"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react"
import { SparklineChart } from "../charts/sparkline-chart"
import { StatCardLoader } from "../charts/chart-loader"

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  sparklineData?: Record<string, unknown>[];
  sparklineKey?: string;
  isLoading?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  sparklineData,
  sparklineKey,
  isLoading = false,
  className
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <StatCardLoader />
        </CardContent>
      </Card>
    )
  }

  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';

    switch (trend.direction) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-2xl font-bold">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>

            {trend && (
              <div className="flex items-center space-x-1">
                {getTrendIcon()}
                <span className={`text-xs font-medium ${getTrendColor()}`}>
                  {trend.value.toFixed(1)}%
                </span>
                {description && (
                  <span className="text-xs text-muted-foreground">
                    {description}
                  </span>
                )}
              </div>
            )}

            {!trend && description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>

          {sparklineData && sparklineKey && (
            <div className="ml-auto">
              <SparklineChart
                data={sparklineData}
                dataKey={sparklineKey}
                height={32}
                width={80}
                color={trend?.direction === 'up' ? '#10b981' : trend?.direction === 'down' ? '#ef4444' : '#6b7280'}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}