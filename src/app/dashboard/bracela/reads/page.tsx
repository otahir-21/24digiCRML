'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ReadsFilterPanel from '@/components/bracela/ReadsFilterPanel';
import ReadsStatsCards from '@/components/bracela/ReadsStatsCards';
import ReadsDataTable from '@/components/bracela/ReadsDataTable';
import bracelaReadsAPI, {
  DataType,
  ViewMode,
  SortOrder,
  AdminReadsResponse,
} from '@/lib/services/bracela-reads';
import apiClient from '@/lib/api-client';

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

interface User {
  profileId: string;
  name: string;
  email: string;
}

interface Device {
  deviceId: string;
  customName: string;
}

export default function BracelaReadsPage() {
  const [filters, setFilters] = useState<FilterValues>({
    dataType: DataType.HEART_RATE,
    profileId: '',
    deviceId: '',
    startDate: '',
    endDate: '',
    viewMode: ViewMode.RAW,
    sortBy: 'timestamp',
    sortOrder: SortOrder.DESC,
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [data, setData] = useState<AdminReadsResponse<any> | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch users and devices on mount
  useEffect(() => {
    fetchUsersAndDevices();
  }, []);

  // Fetch data when filters or page change
  useEffect(() => {
    fetchData();
  }, [filters, page]);

  const fetchUsersAndDevices = async () => {
    try {
      // Fetch all users (profiles) - Note: endpoint uses POST method
      const usersResponse = await apiClient.post('/v1/profile/profiles');
      const fetchedUsers = usersResponse.data.map((profile: any) => ({
        profileId: profile._id || profile.profileId,
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
        email: profile.email || '',
      }));
      setUsers(fetchedUsers);

      // Fetch all device custom names
      const devicesResponse = await apiClient.get('/v1/device/custom-names/all');
      // Response format: { success: boolean, devices: [...], total: number }
      const deviceList = devicesResponse.data.devices || devicesResponse.data;
      const fetchedDevices = deviceList.map((device: any) => ({
        deviceId: device.deviceUUID || device.deviceMAC,
        customName: device.customName || device.deviceUUID,
      }));
      setDevices(fetchedDevices);
    } catch (err) {
      console.error('Error fetching users and devices:', err);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const query = {
        dataType: filters.dataType,
        profileId: filters.profileId || undefined,
        deviceId: filters.deviceId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        viewMode: filters.viewMode,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page,
        limit,
      };

      const response = await bracelaReadsAPI.getReads(query);
      setData(response);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    const defaultFilters: FilterValues = {
      dataType: DataType.HEART_RATE,
      profileId: '',
      deviceId: '',
      startDate: '',
      endDate: '',
      viewMode: ViewMode.RAW,
      sortBy: 'timestamp',
      sortOrder: SortOrder.DESC,
    };
    setFilters(defaultFilters);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportCSV = () => {
    if (!data || !data.data || data.data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data.data[0]).join(',');
    const rows = data.data.map((row) => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bracela-${filters.dataType}-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bracela Health Reads</h1>
          <p className="text-gray-600 mt-1">
            View and analyze health metrics from bracelet devices
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" disabled={isLoading || !data}>
          Export CSV
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Filter Panel */}
      <ReadsFilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        users={users}
        devices={devices}
        isLoading={isLoading}
      />

      {/* Stats Cards */}
      {data && (
        <ReadsStatsCards
          dataType={filters.dataType}
          stats={data.stats}
          dateRange={{
            start: filters.startDate,
            end: filters.endDate,
          }}
          isLoading={isLoading}
        />
      )}

      {/* Data Table */}
      {data && (
        <ReadsDataTable
          dataType={filters.dataType}
          viewMode={filters.viewMode}
          data={data.data}
          pagination={data.pagination}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      )}

      {/* Initial Loading State */}
      {!data && isLoading && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600 text-lg">Loading health data...</span>
        </div>
      )}

      {/* No Data State */}
      {!data && !isLoading && !error && (
        <div className="text-center py-16">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Data Yet</h3>
          <p className="text-gray-500">Select filters and click apply to view health metrics</p>
        </div>
      )}
    </div>
  );
}
