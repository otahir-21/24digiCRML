'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { DataType, ViewMode, SortOrder } from '@/lib/services/bracela-reads';

interface FilterValues {
  dataType: DataType;
  profileId: string;
  deviceId: string;
  startDate: string;
  endDate: string;
  viewMode: ViewMode;
  sortBy: string;
  sortOrder: SortOrder;
}

interface ReadsFilterPanelProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  onClearFilters: () => void;
  users: Array<{ profileId: string; name: string; email: string }>;
  devices: Array<{ deviceId: string; customName: string }>;
  isLoading?: boolean;
}

export default function ReadsFilterPanel({
  filters,
  onFilterChange,
  onClearFilters,
  users,
  devices,
  isLoading = false,
}: ReadsFilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<FilterValues>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (key: keyof FilterValues, value: string) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleDataTypeChange = (dataType: DataType) => {
    const updatedFilters = { ...localFilters, dataType };
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleClear = () => {
    onClearFilters();
  };

  return (
    <Card className="p-6 mb-6">
      <div className="space-y-4">
        {/* Data Type Tabs */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Data Type</Label>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={localFilters.dataType === DataType.HEART_RATE ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDataTypeChange(DataType.HEART_RATE)}
              disabled={isLoading}
            >
              Heart Rate
            </Button>
            <Button
              variant={localFilters.dataType === DataType.STEPS ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDataTypeChange(DataType.STEPS)}
              disabled={isLoading}
            >
              Steps
            </Button>
            <Button
              variant={localFilters.dataType === DataType.BLOOD_PRESSURE ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDataTypeChange(DataType.BLOOD_PRESSURE)}
              disabled={isLoading}
            >
              Blood Pressure
            </Button>
            <Button
              variant={localFilters.dataType === DataType.BLOOD_OXYGEN ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDataTypeChange(DataType.BLOOD_OXYGEN)}
              disabled={isLoading}
            >
              Blood Oxygen
            </Button>
          </div>
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* User Filter */}
          <div>
            <Label htmlFor="profileId" className="text-sm">User</Label>
            <select
              id="profileId"
              value={localFilters.profileId}
              onChange={(e) => handleChange('profileId', e.target.value)}
              disabled={isLoading}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.profileId} value={user.profileId}>
                  {user.name || user.email || user.profileId}
                </option>
              ))}
            </select>
          </div>

          {/* Device Filter */}
          <div>
            <Label htmlFor="deviceId" className="text-sm">Device</Label>
            <select
              id="deviceId"
              value={localFilters.deviceId}
              onChange={(e) => handleChange('deviceId', e.target.value)}
              disabled={isLoading}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Devices</option>
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.customName || device.deviceId}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <Label htmlFor="startDate" className="text-sm">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={localFilters.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              disabled={isLoading}
              className="mt-1"
            />
          </div>

          {/* End Date */}
          <div>
            <Label htmlFor="endDate" className="text-sm">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={localFilters.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              disabled={isLoading}
              className="mt-1"
            />
          </div>
        </div>

        {/* View Mode and Sorting */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* View Mode */}
          <div>
            <Label htmlFor="viewMode" className="text-sm">View Mode</Label>
            <select
              id="viewMode"
              value={localFilters.viewMode}
              onChange={(e) => handleChange('viewMode', e.target.value as ViewMode)}
              disabled={isLoading}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={ViewMode.RAW}>Raw Records</option>
              <option value={ViewMode.AGGREGATED}>Aggregated Stats</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <Label htmlFor="sortBy" className="text-sm">Sort By</Label>
            <select
              id="sortBy"
              value={localFilters.sortBy}
              onChange={(e) => handleChange('sortBy', e.target.value)}
              disabled={isLoading}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="timestamp">Timestamp</option>
              {localFilters.viewMode === ViewMode.RAW && (
                <>
                  {localFilters.dataType === DataType.HEART_RATE && <option value="value">Heart Rate</option>}
                  {localFilters.dataType === DataType.STEPS && <option value="steps">Steps</option>}
                  {localFilters.dataType === DataType.BLOOD_PRESSURE && <option value="systolic">Systolic</option>}
                  {localFilters.dataType === DataType.BLOOD_OXYGEN && <option value="spo2">SpO2</option>}
                </>
              )}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <Label htmlFor="sortOrder" className="text-sm">Sort Order</Label>
            <select
              id="sortOrder"
              value={localFilters.sortOrder}
              onChange={(e) => handleChange('sortOrder', e.target.value as SortOrder)}
              disabled={isLoading}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={SortOrder.DESC}>Newest First</option>
              <option value={SortOrder.ASC}>Oldest First</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={isLoading}
          >
            Clear Filters
          </Button>
        </div>
      </div>
    </Card>
  );
}
