'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DataType,
  ViewMode,
  HeartRateRecord,
  HeartRateAggregated,
  StepsRecord,
  StepsAggregated,
  BloodPressureRecord,
  BloodPressureAggregated,
  BloodOxygenRecord,
  BloodOxygenAggregated,
  Pagination,
} from '@/lib/services/bracela-reads';

interface ReadsDataTableProps {
  dataType: DataType;
  viewMode: ViewMode;
  data: any[];
  pagination: Pagination;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export default function ReadsDataTable({
  dataType,
  viewMode,
  data,
  pagination,
  onPageChange,
  isLoading = false,
}: ReadsDataTableProps) {
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  const truncateId = (id: string, length = 8) => {
    if (!id) return 'N/A';
    return id.length > length ? `${id.substring(0, length)}...` : id;
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      normal: 'bg-green-100 text-green-800',
      elevated: 'bg-yellow-100 text-yellow-800',
      stage1: 'bg-orange-100 text-orange-800',
      stage2: 'bg-red-100 text-red-800',
      crisis: 'bg-red-600 text-white',
      low: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
      high: 'bg-blue-100 text-blue-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const renderTableHeaders = () => {
    if (viewMode === ViewMode.AGGREGATED) {
      switch (dataType) {
        case DataType.HEART_RATE:
          return (
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg BPM</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min BPM</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max BPM</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Records</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
            </tr>
          );
        case DataType.STEPS:
          return (
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Steps</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance (m)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calories</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Cadence</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity Time</th>
            </tr>
          );
        case DataType.BLOOD_PRESSURE:
          return (
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Systolic</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Diastolic</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Pulse</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Records</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categories</th>
            </tr>
          );
        case DataType.BLOOD_OXYGEN:
          return (
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg SpO2</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min SpO2</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max SpO2</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg HR</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Records</th>
            </tr>
          );
      }
    } else {
      // Raw view headers
      switch (dataType) {
        case DataType.HEART_RATE:
          return (
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">BPM</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quality</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HRV (ms)</th>
            </tr>
          );
        case DataType.STEPS:
          return (
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Steps</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance (m)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calories</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cadence</th>
            </tr>
          );
        case DataType.BLOOD_PRESSURE:
          return (
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Systolic</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diastolic</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pulse</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time of Day</th>
            </tr>
          );
        case DataType.BLOOD_OXYGEN:
          return (
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SpO2 (%)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Heart Rate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resp. Rate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perfusion</th>
            </tr>
          );
      }
    }
  };

  const renderTableRows = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={8} className="px-4 py-8 text-center">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading data...</span>
            </div>
          </td>
        </tr>
      );
    }

    if (!data || data.length === 0) {
      return (
        <tr>
          <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
            No data found for the selected filters.
          </td>
        </tr>
      );
    }

    if (viewMode === ViewMode.AGGREGATED) {
      return data.map((row, index) => {
        switch (dataType) {
          case DataType.HEART_RATE:
            const hrAgg = row as HeartRateAggregated;
            return (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{hrAgg._id.date}</td>
                <td className="px-4 py-3 font-mono text-sm">{truncateId(hrAgg._id.profileId.toString())}</td>
                <td className="px-4 py-3 font-mono text-sm">{truncateId(hrAgg._id.deviceId)}</td>
                <td className="px-4 py-3 font-semibold text-blue-600">{Math.round(hrAgg.avgHeartRate)}</td>
                <td className="px-4 py-3">{Math.round(hrAgg.minHeartRate)}</td>
                <td className="px-4 py-3">{Math.round(hrAgg.maxHeartRate)}</td>
                <td className="px-4 py-3">{hrAgg.count}</td>
                <td className="px-4 py-3 text-xs">
                  <div>Rest: {hrAgg.restingCount}</div>
                  <div>Active: {hrAgg.activeCount}</div>
                  <div>Exercise: {hrAgg.exerciseCount}</div>
                </td>
              </tr>
            );
          case DataType.STEPS:
            const stepsAgg = row as StepsAggregated;
            return (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{stepsAgg._id.date}</td>
                <td className="px-4 py-3 font-mono text-sm">{truncateId(stepsAgg._id.profileId.toString())}</td>
                <td className="px-4 py-3 font-mono text-sm">{truncateId(stepsAgg._id.deviceId)}</td>
                <td className="px-4 py-3 font-semibold text-blue-600">{stepsAgg.totalSteps.toLocaleString()}</td>
                <td className="px-4 py-3">{Math.round(stepsAgg.totalDistance)}</td>
                <td className="px-4 py-3">{Math.round(stepsAgg.totalCalories)}</td>
                <td className="px-4 py-3">{stepsAgg.avgCadence ? Math.round(stepsAgg.avgCadence) : 'N/A'}</td>
                <td className="px-4 py-3 text-xs">
                  <div>Walk: {stepsAgg.walkingMinutes}m</div>
                  <div>Run: {stepsAgg.runningMinutes}m</div>
                </td>
              </tr>
            );
          case DataType.BLOOD_PRESSURE:
            const bpAgg = row as BloodPressureAggregated;
            return (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{bpAgg._id.date}</td>
                <td className="px-4 py-3 font-mono text-sm">{truncateId(bpAgg._id.profileId.toString())}</td>
                <td className="px-4 py-3 font-mono text-sm">{truncateId(bpAgg._id.deviceId)}</td>
                <td className="px-4 py-3 font-semibold text-red-600">{Math.round(bpAgg.avgSystolic)}</td>
                <td className="px-4 py-3 font-semibold text-blue-600">{Math.round(bpAgg.avgDiastolic)}</td>
                <td className="px-4 py-3">{Math.round(bpAgg.avgPulse)}</td>
                <td className="px-4 py-3">{bpAgg.count}</td>
                <td className="px-4 py-3 text-xs">
                  <div>Normal: {bpAgg.normalCount}</div>
                  <div>Elevated: {bpAgg.elevatedCount}</div>
                  <div>Crisis: {bpAgg.crisisCount}</div>
                </td>
              </tr>
            );
          case DataType.BLOOD_OXYGEN:
            const boAgg = row as BloodOxygenAggregated;
            return (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{boAgg._id.date}</td>
                <td className="px-4 py-3 font-mono text-sm">{truncateId(boAgg._id.profileId.toString())}</td>
                <td className="px-4 py-3 font-mono text-sm">{truncateId(boAgg._id.deviceId)}</td>
                <td className="px-4 py-3 font-semibold text-blue-600">{Math.round(boAgg.avgSpo2)}%</td>
                <td className="px-4 py-3">{Math.round(boAgg.minSpo2)}%</td>
                <td className="px-4 py-3">{Math.round(boAgg.maxSpo2)}%</td>
                <td className="px-4 py-3">{Math.round(boAgg.avgHeartRate)}</td>
                <td className="px-4 py-3">{boAgg.count}</td>
              </tr>
            );
        }
      });
    } else {
      // Raw view rows
      return data.map((row, index) => {
        switch (dataType) {
          case DataType.HEART_RATE:
            const hr = row as HeartRateRecord;
            return (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{formatDateTime(hr.timestamp)}</td>
                <td className="px-4 py-3 font-mono text-sm">{truncateId(hr.profileId.toString())}</td>
                <td className="px-4 py-3 font-mono text-sm">{truncateId(hr.deviceId)}</td>
                <td className="px-4 py-3 font-semibold text-blue-600">{hr.value}</td>
                <td className="px-4 py-3">
                  <Badge className="text-xs">{hr.type}</Badge>
                </td>
                <td className="px-4 py-3">{hr.zone || 'N/A'}</td>
                <td className="px-4 py-3">{hr.metadata?.quality || 'N/A'}</td>
                <td className="px-4 py-3">{hr.metadata?.hrvMs || 'N/A'}</td>
              </tr>
            );
          case DataType.STEPS:
            const steps = row as StepsRecord;
            return (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{formatDateTime(steps.timestamp)}</td>
                <td className="px-4 py-3 font-mono text-sm">{truncateId(steps.profileId.toString())}</td>
                <td className="px-4 py-3 font-mono text-sm">{truncateId(steps.deviceId)}</td>
                <td className="px-4 py-3 font-semibold text-blue-600">{steps.steps}</td>
                <td className="px-4 py-3">{Math.round(steps.distance)}</td>
                <td className="px-4 py-3">{Math.round(steps.calories)}</td>
                <td className="px-4 py-3">
                  <Badge className="text-xs">{steps.activityType}</Badge>
                </td>
                <td className="px-4 py-3">{steps.cadence || 'N/A'}</td>
              </tr>
            );
          case DataType.BLOOD_PRESSURE:
            const bp = row as BloodPressureRecord;
            return (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{formatDateTime(bp.timestamp)}</td>
                <td className="px-4 py-3 font-mono text-sm">{truncateId(bp.profileId.toString())}</td>
                <td className="px-4 py-3 font-mono text-sm">{truncateId(bp.deviceId)}</td>
                <td className="px-4 py-3 font-semibold text-red-600">{bp.systolic}</td>
                <td className="px-4 py-3 font-semibold text-blue-600">{bp.diastolic}</td>
                <td className="px-4 py-3">{bp.pulse}</td>
                <td className="px-4 py-3">
                  <Badge className={`text-xs ${getCategoryBadgeColor(bp.category)}`}>{bp.category}</Badge>
                </td>
                <td className="px-4 py-3">{bp.timeOfDay || 'N/A'}</td>
              </tr>
            );
          case DataType.BLOOD_OXYGEN:
            const bo = row as BloodOxygenRecord;
            return (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{formatDateTime(bo.timestamp)}</td>
                <td className="px-4 py-3 font-mono text-sm">{truncateId(bo.profileId.toString())}</td>
                <td className="px-4 py-3 font-mono text-sm">{truncateId(bo.deviceId)}</td>
                <td className="px-4 py-3 font-semibold text-blue-600">{bo.spo2}%</td>
                <td className="px-4 py-3">{bo.heartRate || 'N/A'}</td>
                <td className="px-4 py-3">
                  <Badge className={`text-xs ${getCategoryBadgeColor(bo.level)}`}>{bo.level}</Badge>
                </td>
                <td className="px-4 py-3">{bo.respiratoryRate || 'N/A'}</td>
                <td className="px-4 py-3">{bo.perfusionIndex || 'N/A'}</td>
              </tr>
            );
        }
      });
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>{renderTableHeaders()}</thead>
          <tbody className="bg-white divide-y divide-gray-200">{renderTableRows()}</tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && data && data.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {pagination.page} of {pagination.pages} ({pagination.total} total records)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={pagination.page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            {pagination.pages > 5 && <span className="px-2 py-1">...</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
