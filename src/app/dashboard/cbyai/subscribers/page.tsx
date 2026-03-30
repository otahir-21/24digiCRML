"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Download,
  Search,
} from "lucide-react";
import { cbyaiSubscribersService } from "@/lib/api-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Subscriber {
  subscriptionId: string;
  profileId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  packageId: string;
  packageName: string;
  status: string;
  startDate: string;
  endDate: string;
  subscriptionPrice: number;
  currency: string;
  autoRenew: boolean;
  totalMealsGenerated: number;
  totalMealsDelivered: number;
  monthlyCreditsLimit: number;
  monthlyCreditsUsed: number;
  isTrial: boolean;
  trialEndDate?: string;
  createdAt: string;
  daysRemaining: number;
}

interface Statistics {
  totalSubscribers: number;
  activeSubscribers: number;
  expiredSubscribers: number;
  cancelledSubscribers: number;
  trialSubscribers: number;
  totalRevenue: number;
  currency: string;
}

export default function CByAISubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [selectedSubscriber, setSelectedSubscriber] =
    useState<Subscriber | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [packageFilter, setPackageFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, packageFilter, searchQuery, currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch subscribers
      const subscribersData = await cbyaiSubscribersService.getAll({
        status: statusFilter !== "all" ? statusFilter : undefined,
        packageId: packageFilter !== "all" ? packageFilter : undefined,
        search: searchQuery || undefined,
        page: currentPage,
        limit: pageSize,
      });

      setSubscribers(subscribersData.subscribers || []);
      setTotalPages(subscribersData.pagination?.pages || 1);
      setTotalCount(subscribersData.pagination?.total || 0);

      // Fetch statistics
      const statsData = await cbyaiSubscribersService.getStatistics();
      setStatistics(statsData);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export subscribers data");
  };

  const handleViewDetails = (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      active: "default",
      expired: "secondary",
      cancelled: "destructive",
      paused: "outline",
      trial: "outline",
      pending: "outline",
    };

    return (
      <Badge variant={variants[status.toLowerCase()] || "secondary"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const columns: Column<Subscriber>[] = [
    {
      key: "customerName",
      header: "Customer",
      render: (row) => (
        <div>
          <div className="font-medium">{row.customerName}</div>
          <div className="text-xs text-gray-500">
            {row.customerEmail || row.customerPhone}
          </div>
          <div className="font-mono text-xs text-gray-400 mt-0.5">
            {row.profileId.substring(0, 12)}...
          </div>
        </div>
      ),
    },
    {
      key: "packageName",
      header: "Package",
      render: (row) => (
        <div>
          <div className="font-medium">{row.packageName}</div>
          <div className="text-xs text-gray-500">{row.packageId}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: "startDate",
      header: "Duration",
      render: (row) => {
        const startDate = new Date(row.startDate);
        const endDate = new Date(row.endDate);
        return (
          <div className="text-sm">
            <div>{startDate.toLocaleDateString()}</div>
            <div className="text-gray-500">
              to {endDate.toLocaleDateString()}
            </div>
            {row.daysRemaining > 0 && (
              <div className="text-xs text-blue-600">
                {row.daysRemaining} days left
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "monthlyCreditsUsed",
      header: "Usage",
      render: (row) => (
        <div className="text-sm">
          <div>
            <span className="font-medium">{row.monthlyCreditsUsed}</span>
            {row.monthlyCreditsLimit > 0 && (
              <span className="text-gray-500">
                {" "}
                / {row.monthlyCreditsLimit}
              </span>
            )}
            {row.monthlyCreditsLimit === 0 && (
              <span className="text-gray-500"> / ∞</span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {row.totalMealsGenerated} meals | {row.totalMealsDelivered}{" "}
            delivered
          </div>
        </div>
      ),
    },
    {
      key: "subscriptionPrice",
      header: "Revenue",
      render: (row) => (
        <div className="font-medium">
          {row.currency} {row.subscriptionPrice.toFixed(2)}
        </div>
      ),
    },
    {
      key: "autoRenew",
      header: "Auto-Renew",
      render: (row) => (
        <Badge variant={row.autoRenew ? "default" : "secondary"}>
          {row.autoRenew ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      key: "subscriptionId",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(row)}
          >
            View Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Subscribers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.totalSubscribers}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics.activeSubscribers}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {statistics.expiredSubscribers}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {statistics.cancelledSubscribers}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trial Users</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {statistics.trialSubscribers}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {statistics.currency} {statistics.totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>C by AI Subscribers</CardTitle>
              <CardDescription>
                Manage and monitor all C by AI subscription subscribers
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by Profile ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={packageFilter}
              onValueChange={(value) => {
                setPackageFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Package" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Packages</SelectItem>
                <SelectItem value="CBYAI_1M">1 Month</SelectItem>
                <SelectItem value="CBYAI_3M">3 Months</SelectItem>
                <SelectItem value="CBYAI_6M">6 Months</SelectItem>
                <SelectItem value="CBYAI_1Y">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading subscribers...</div>
            </div>
          ) : (
            <DataTable<Subscriber>
              columns={columns}
              data={subscribers}
              searchable={false}
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
                subscribers
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Subscription Details</span>
              {selectedSubscriber?.isTrial && (
                <Badge variant="outline" className="ml-2">
                  TRIAL
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Complete information about this subscription
            </DialogDescription>
          </DialogHeader>

          {selectedSubscriber && (
            <div className="space-y-6 mt-4">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">
                      {selectedSubscriber.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Profile ID</p>
                    <p className="font-mono text-sm">
                      {selectedSubscriber.profileId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">
                      {selectedSubscriber.customerEmail || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">
                      {selectedSubscriber.customerPhone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Subscription Details
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Subscription ID</p>
                    <p className="font-mono text-sm">
                      {selectedSubscriber.subscriptionId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div>{getStatusBadge(selectedSubscriber.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Package</p>
                    <p className="font-medium">
                      {selectedSubscriber.packageName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedSubscriber.packageId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Auto-Renew</p>
                    <Badge
                      variant={
                        selectedSubscriber.autoRenew ? "default" : "secondary"
                      }
                    >
                      {selectedSubscriber.autoRenew ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="font-medium">
                      {new Date(
                        selectedSubscriber.startDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p className="font-medium">
                      {new Date(
                        selectedSubscriber.endDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Days Remaining</p>
                    <p className="font-medium text-blue-600">
                      {selectedSubscriber.daysRemaining} days
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created At</p>
                    <p className="font-medium">
                      {new Date(selectedSubscriber.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedSubscriber.isTrial &&
                    selectedSubscriber.trialEndDate && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">Trial End Date</p>
                        <p className="font-medium text-blue-600">
                          {new Date(
                            selectedSubscriber.trialEndDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                </div>
              </div>

              {/* Usage Statistics */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Usage Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">
                      Monthly Credits Used
                    </p>
                    <p className="font-medium">
                      {selectedSubscriber.monthlyCreditsUsed}
                      {selectedSubscriber.monthlyCreditsLimit > 0 && (
                        <span className="text-gray-500">
                          {" "}
                          / {selectedSubscriber.monthlyCreditsLimit}
                        </span>
                      )}
                      {selectedSubscriber.monthlyCreditsLimit === 0 && (
                        <span className="text-gray-500"> / ∞</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Credits Remaining</p>
                    <p className="font-medium text-green-600">
                      {selectedSubscriber.monthlyCreditsLimit === 0
                        ? "∞"
                        : selectedSubscriber.monthlyCreditsLimit -
                          selectedSubscriber.monthlyCreditsUsed}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      Total Meals Generated
                    </p>
                    <p className="font-medium">
                      {selectedSubscriber.totalMealsGenerated}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      Total Meals Delivered
                    </p>
                    <p className="font-medium">
                      {selectedSubscriber.totalMealsDelivered}
                    </p>
                  </div>
                </div>
              </div>

              {/* Billing Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Billing Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Subscription Price</p>
                    <p className="font-medium text-lg">
                      {selectedSubscriber.currency}{" "}
                      {selectedSubscriber.subscriptionPrice.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Currency</p>
                    <p className="font-medium">{selectedSubscriber.currency}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
