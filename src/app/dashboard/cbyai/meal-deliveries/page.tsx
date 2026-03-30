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
  ChefHat,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Search,
  Calendar,
  User,
  MapPin,
  Star,
} from "lucide-react";
import { mealDeliveriesService } from "@/lib/api-client";
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

interface MealReference {
  mealId: string;
  mealType: string;
  mealName: string;
  mealTime: string;
  totalCalories?: number;
  preparationNotes?: string;
}

interface DeliveryAddress {
  addressId: string;
  fullAddress: string;
  emirate?: string;
  area?: string;
  lat?: number;
  lng?: number;
  buildingName?: string;
  apartmentNumber?: string;
  instructions?: string;
}

interface MealDelivery {
  deliveryId: string;
  profileId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  mealDate: string;
  mealDay: number;
  meals: MealReference[];
  scheduledDeliveryTime: string;
  deliveryAddress: DeliveryAddress;
  status: string;
  driverProfileId?: string;
  driverName?: string;
  driverPhone?: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  actualDeliveryTime?: string;
  deliveryRating?: number;
  deliveryFeedback?: string;
  specialInstructions?: string;
  cancellationReason?: string;
  isSubscriptionBased: boolean;
  subscriptionId?: string;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

interface DeliveryStatistics {
  totalDeliveries: number;
  deliveredCount: number;
  cancelledCount: number;
  pendingCount: number;
  averageDeliveryTime: number;
  onTimePercentage: number;
  totalMealsDelivered: number;
  averageRating: number;
  statusBreakdown: Record<string, number>;
}

export default function MealDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<MealDelivery[]>([]);
  const [statistics, setStatistics] = useState<DeliveryStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [selectedDelivery, setSelectedDelivery] = useState<MealDelivery | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;

  // Get date range for statistics (last 30 days by default)
  const getStatisticsDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchQuery, startDate, endDate, currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Build filters
      const filters: Record<string, unknown> = {
        page: currentPage,
        limit: pageSize,
      };

      if (statusFilter !== "all") filters.status = statusFilter;
      if (searchQuery) filters.profileId = searchQuery;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      // Fetch deliveries
      const deliveriesData = await mealDeliveriesService.getAll(filters);
      setDeliveries(deliveriesData.deliveries || []);
      setTotalPages(deliveriesData.pagination?.pages || 1);
      setTotalCount(deliveriesData.pagination?.total || 0);

      // Fetch statistics
      const { startDate: statsStart, endDate: statsEnd } =
        getStatisticsDateRange();
      const statsData = await mealDeliveriesService.getStatistics(
        statsStart,
        statsEnd
      );
      setStatistics(statsData);
    } catch (error) {
      console.error("Error fetching meal deliveries:", error);
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
    console.log("Export meal deliveries data");
  };

  const handleViewDetails = (delivery: MealDelivery) => {
    setSelectedDelivery(delivery);
    setShowDetailsModal(true);
  };

  const handleAssignDriver = (delivery: MealDelivery) => {
    setSelectedDelivery(delivery);
    setShowAssignDriverModal(true);
  };

  const handleCancelDelivery = (delivery: MealDelivery) => {
    setSelectedDelivery(delivery);
    setShowCancelModal(true);
  };

  // const handleUpdateStatus = async (deliveryId: string, newStatus: string) => {
  //   try {
  //     await mealDeliveriesService.updateStatus(deliveryId, newStatus)
  //     await fetchData()
  //   } catch (error) {
  //     console.error("Error updating status:", error)
  //   }
  // }

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      scheduled: "outline",
      preparing: "secondary",
      ready: "default",
      assigned: "default",
      picked_up: "default",
      in_transit: "default",
      delivered: "default",
      cancelled: "destructive",
    };

    const colors: Record<string, string> = {
      scheduled: "text-gray-600",
      preparing: "text-orange-600",
      ready: "text-blue-600",
      assigned: "text-purple-600",
      picked_up: "text-indigo-600",
      in_transit: "text-yellow-600",
      delivered: "text-green-600",
      cancelled: "text-red-600",
    };

    return (
      <Badge
        variant={variants[status.toLowerCase()] || "secondary"}
        className={colors[status.toLowerCase()]}
      >
        {status.toUpperCase().replace("_", " ")}
      </Badge>
    );
  };

  const getMealTypeBadge = (mealType: string) => {
    const colors: Record<string, string> = {
      breakfast: "bg-yellow-100 text-yellow-800",
      lunch: "bg-green-100 text-green-800",
      dinner: "bg-blue-100 text-blue-800",
      snack: "bg-purple-100 text-purple-800",
    };

    return (
      <span
        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
          colors[mealType.toLowerCase()] || "bg-gray-100 text-gray-800"
        }`}
      >
        {mealType}
      </span>
    );
  };

  const columns: Column<MealDelivery>[] = [
    {
      key: "deliveryId",
      header: "Delivery ID",
      render: (row) => (
        <div>
          <div className="font-mono text-sm">
            {row.deliveryId.substring(0, 8)}...
          </div>
          <div className="text-xs text-gray-500">
            {new Date(row.mealDate).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      render: (row) => (
        <div>
          <div className="font-medium">{row.customerName}</div>
          <div className="text-xs text-gray-500">
            {row.customerEmail || row.customerPhone}
          </div>
        </div>
      ),
    },
    {
      key: "meals",
      header: "Meals",
      render: (row) => (
        <div className="space-y-1">
          <div className="font-medium">{row.meals.length} meal(s)</div>
          <div className="flex flex-wrap gap-1">
            {row.meals.slice(0, 2).map((meal, idx) => (
              <span key={idx}>{getMealTypeBadge(meal.mealType)}</span>
            ))}
            {row.meals.length > 2 && (
              <span className="text-xs text-gray-500">
                +{row.meals.length - 2} more
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "scheduledDeliveryTime",
      header: "Scheduled Time",
      render: (row) => {
        const scheduled = new Date(row.scheduledDeliveryTime);
        return (
          <div className="text-sm">
            <div>
              {scheduled.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="text-xs text-gray-500">
              {scheduled.toLocaleDateString()}
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: "driverName",
      header: "Driver",
      render: (row) => (
        <div>
          {row.driverName ? (
            <>
              <div className="font-medium">{row.driverName}</div>
              <div className="text-xs text-gray-500">{row.driverPhone}</div>
            </>
          ) : (
            <span className="text-gray-400">Not assigned</span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(row)}
          >
            View
          </Button>
          {row.status === "ready" && !row.driverProfileId && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleAssignDriver(row)}
            >
              Assign Driver
            </Button>
          )}
          {row.status !== "delivered" && row.status !== "cancelled" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleCancelDelivery(row)}
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <ChefHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.totalDeliveries}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {statistics.statusBreakdown?.scheduled || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preparing</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {statistics.statusBreakdown?.preparing || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {statistics.statusBreakdown?.ready || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Truck className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {(statistics.statusBreakdown?.in_transit || 0) +
                  (statistics.statusBreakdown?.picked_up || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics.deliveredCount}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {statistics.onTimePercentage.toFixed(1)}% on time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {statistics.cancelledCount}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Statistics Row */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Meals Delivered
              </CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {statistics.totalMealsDelivered}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Delivery Time
              </CardTitle>
              <Clock className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {Math.round(statistics.averageDeliveryTime)} min
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {statistics.averageRating.toFixed(1)} / 5
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
              <CardTitle>Meal Deliveries</CardTitle>
              <CardDescription>
                Manage and track all C by AI meal deliveries
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="picked_up">Picked Up</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Data Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading deliveries...</div>
            </div>
          ) : (
            <DataTable columns={columns} data={deliveries} searchable={false} />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
                deliveries
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Delivery Details</span>
              {selectedDelivery && getStatusBadge(selectedDelivery.status)}
            </DialogTitle>
            <DialogDescription>
              Complete information about this meal delivery
            </DialogDescription>
          </DialogHeader>

          {selectedDelivery && (
            <div className="space-y-6 mt-4">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">
                      {selectedDelivery.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Profile ID</p>
                    <p className="font-mono text-sm">
                      {selectedDelivery.profileId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">
                      {selectedDelivery.customerEmail || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">
                      {selectedDelivery.customerPhone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Delivery Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Delivery ID</p>
                    <p className="font-mono text-sm">
                      {selectedDelivery.deliveryId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div>{getStatusBadge(selectedDelivery.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Meal Date</p>
                    <p className="font-medium">
                      {new Date(selectedDelivery.mealDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Scheduled Time</p>
                    <p className="font-medium">
                      {new Date(
                        selectedDelivery.scheduledDeliveryTime
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Meal Day</p>
                    <p className="font-medium">
                      Day {selectedDelivery.mealDay} of 7
                    </p>
                  </div>
                  {selectedDelivery.actualDeliveryTime && (
                    <div>
                      <p className="text-sm text-gray-500">
                        Actual Delivery Time
                      </p>
                      <p className="font-medium">
                        {new Date(
                          selectedDelivery.actualDeliveryTime
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Meals List */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  Meals ({selectedDelivery.meals.length})
                </h3>
                <div className="space-y-3">
                  {selectedDelivery.meals.map((meal, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getMealTypeBadge(meal.mealType)}
                            <span className="font-medium">{meal.mealName}</span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Time: {meal.mealTime}</div>
                            {meal.totalCalories && (
                              <div>Calories: {meal.totalCalories} kcal</div>
                            )}
                            {meal.preparationNotes && (
                              <div className="italic">
                                Note: {meal.preparationNotes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium mb-2">
                    {selectedDelivery.deliveryAddress.fullAddress}
                  </p>
                  {selectedDelivery.deliveryAddress.buildingName && (
                    <p className="text-sm text-gray-600">
                      Building: {selectedDelivery.deliveryAddress.buildingName}
                    </p>
                  )}
                  {selectedDelivery.deliveryAddress.apartmentNumber && (
                    <p className="text-sm text-gray-600">
                      Apt: {selectedDelivery.deliveryAddress.apartmentNumber}
                    </p>
                  )}
                  {selectedDelivery.deliveryAddress.instructions && (
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Instructions:</span>{" "}
                      {selectedDelivery.deliveryAddress.instructions}
                    </p>
                  )}
                </div>
              </div>

              {/* Driver Information */}
              {selectedDelivery.driverProfileId && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Driver Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">
                        {selectedDelivery.driverName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">
                        {selectedDelivery.driverPhone || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Assigned At</p>
                      <p className="font-medium">
                        {selectedDelivery.assignedAt
                          ? new Date(
                              selectedDelivery.assignedAt
                            ).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Picked Up At</p>
                      <p className="font-medium">
                        {selectedDelivery.pickedUpAt
                          ? new Date(
                              selectedDelivery.pickedUpAt
                            ).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rating & Feedback */}
              {selectedDelivery.deliveryRating && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Customer Rating
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-2xl font-bold text-yellow-500">
                        {selectedDelivery.deliveryRating} / 5
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= selectedDelivery.deliveryRating!
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {selectedDelivery.deliveryFeedback && (
                      <p className="text-sm text-gray-600 italic">
                        {selectedDelivery.deliveryFeedback}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Special Instructions / Cancellation Reason */}
              {selectedDelivery.specialInstructions && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Special Instructions
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm">
                      {selectedDelivery.specialInstructions}
                    </p>
                  </div>
                </div>
              )}

              {selectedDelivery.cancellationReason && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Cancellation Reason
                  </h3>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-800">
                      {selectedDelivery.cancellationReason}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Driver Modal */}
      <Dialog open={showAssignDriverModal} onOpenChange={setShowAssignDriverModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription>
              Assign a driver to delivery {selectedDelivery?.deliveryId}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Driver assignment functionality will be implemented here.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Delivery Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Delivery</DialogTitle>
            <DialogDescription>
              Cancel delivery {selectedDelivery?.deliveryId}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Delivery cancellation functionality will be implemented here.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
