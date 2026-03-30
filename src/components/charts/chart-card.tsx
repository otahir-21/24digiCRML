"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw } from "lucide-react"
import { ReactNode } from "react"

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
  actions?: ReactNode;
}

export function ChartCard({
  title,
  description,
  children,
  className,
  onRefresh,
  onExport,
  isLoading = false,
  actions
}: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}