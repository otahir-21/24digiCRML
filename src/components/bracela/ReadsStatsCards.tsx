'use client';

import { Card } from '@/components/ui/card';
import { DataType, Stats } from '@/lib/services/bracela-reads';

interface ReadsStatsCardsProps {
  dataType: DataType;
  stats: Stats;
  dateRange?: { start?: string; end?: string };
  isLoading?: boolean;
}

export default function ReadsStatsCards({
  dataType,
  stats,
  dateRange,
  isLoading = false,
}: ReadsStatsCardsProps) {
  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  const renderStatCards = () => {
    if (isLoading) {
      return (
        <>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </Card>
          ))}
        </>
      );
    }

    switch (dataType) {
      case DataType.HEART_RATE:
        return (
          <>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-1">Total Records</div>
              <div className="text-2xl font-bold">{formatNumber(stats.count)}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-1">Average BPM</div>
              <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.avg)}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-1">Min BPM</div>
              <div className="text-2xl font-bold text-green-600">{formatNumber(stats.min)}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-1">Max BPM</div>
              <div className="text-2xl font-bold text-red-600">{formatNumber(stats.max)}</div>
            </Card>
          </>
        );

      case DataType.STEPS:
        return (
          <>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-1">Total Records</div>
              <div className="text-2xl font-bold">{formatNumber(stats.count)}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-1">Total Steps</div>
              <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.totalSteps)}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-1">Distance (m)</div>
              <div className="text-2xl font-bold text-green-600">{formatNumber(stats.totalDistance)}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-1">Calories</div>
              <div className="text-2xl font-bold text-orange-600">{formatNumber(stats.totalCalories)}</div>
            </Card>
          </>
        );

      case DataType.BLOOD_PRESSURE:
        return (
          <>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-1">Total Records</div>
              <div className="text-2xl font-bold">{formatNumber(stats.count)}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-1">Avg Systolic</div>
              <div className="text-2xl font-bold text-red-600">{formatNumber(stats.avgSystolic)}</div>
              <div className="text-xs text-gray-500 mt-1">
                Range: {formatNumber(stats.minSystolic)} - {formatNumber(stats.maxSystolic)}
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-1">Avg Diastolic</div>
              <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.avgDiastolic)}</div>
              <div className="text-xs text-gray-500 mt-1">
                Range: {formatNumber(stats.minDiastolic)} - {formatNumber(stats.maxDiastolic)}
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-1">Date Range</div>
              <div className="text-sm font-medium">
                {formatDate(dateRange?.start)} - {formatDate(dateRange?.end)}
              </div>
            </Card>
          </>
        );

      case DataType.BLOOD_OXYGEN:
        return (
          <>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-1">Total Records</div>
              <div className="text-2xl font-bold">{formatNumber(stats.count)}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-1">Average SpO2</div>
              <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.avg)}%</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-1">Min SpO2</div>
              <div className="text-2xl font-bold text-orange-600">{formatNumber(stats.min)}%</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-1">Max SpO2</div>
              <div className="text-2xl font-bold text-green-600">{formatNumber(stats.max)}%</div>
            </Card>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {renderStatCards()}
    </div>
  );
}
