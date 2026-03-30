"use client"

interface ChartLoaderProps {
  height?: number;
  className?: string;
}

export function ChartLoader({ height = 300, className }: ChartLoaderProps) {
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ height }}>
      <div className="space-y-4 w-full">
        {/* Chart skeleton */}
        <div className="flex items-end justify-between h-48 space-x-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              style={{
                height: `${Math.random() * 60 + 40}%`,
                width: '12%'
              }}
            />
          ))}
        </div>

        {/* Legend skeleton */}
        <div className="flex justify-center space-x-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function StatCardLoader() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
  )
}

export function TableLoader({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-4">
      {/* Table header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }, (_, i) => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }, (_, colIndex) => (
            <div key={colIndex} className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )
}