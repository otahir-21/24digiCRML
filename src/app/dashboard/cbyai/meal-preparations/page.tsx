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
  RefreshCw,
  Calendar,
  Utensils,
  ClipboardList,
} from "lucide-react";
import { mealPreparationsService } from "@/lib/api-client";
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
  DialogFooter,
} from "@/components/ui/dialog";

interface MealReference {
  mealId: string;
  mealType: string;
  mealName: string;
  mealTime: string;
  totalCalories?: number;
  preparationNotes?: string;
}

interface PreparationItem {
  deliveryId: string;
  profileId: string;
  customerName: string;
  mealDate: string;
  mealDay: number;
  meals: MealReference[];
  scheduledDeliveryTime: string;
  status: string;
  specialInstructions?: string;
  createdAt: string;
}

interface MealTypeAggregation {
  breakfast: number;
  lunch: number;
  dinner: number;
  snack: number;
  total: number;
}

export default function MealPreparationsPage() {
  const [preparations, setPreparations] = useState<PreparationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [showPreparingModal, setShowPreparingModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] =
    useState<PreparationItem | null>(null);
  const [preparedBy, setPreparedBy] = useState("");
  const [preparationNotes, setPreparationNotes] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");

  // Filters
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [mealTypeFilter, setMealTypeFilter] = useState<string>("all");

  // Aggregation
  const [aggregation, setAggregation] = useState<MealTypeAggregation>({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0,
    total: 0,
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, mealTypeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch preparation queue
      const queueData = await mealPreparationsService.getPreparationQueue(
        selectedDate,
        mealTypeFilter !== "all" ? mealTypeFilter : undefined
      );

      setPreparations(queueData.deliveries || []);

      // Calculate aggregation
      calculateAggregation(queueData.deliveries || []);
    } catch (error) {
      console.error("Error fetching meal preparations:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAggregation = (items: PreparationItem[]) => {
    const agg: MealTypeAggregation = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
      total: 0,
    };

    items.forEach((item) => {
      item.meals.forEach((meal) => {
        const type = meal.mealType.toLowerCase();
        if (type === "breakfast") agg.breakfast++;
        else if (type === "lunch") agg.lunch++;
        else if (type === "dinner") agg.dinner++;
        else if (type === "snack") agg.snack++;
        agg.total++;
      });
    });

    setAggregation(agg);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleMarkAsPreparing = (delivery: PreparationItem) => {
    setSelectedDelivery(delivery);
    setShowPreparingModal(true);
    setPreparedBy("");
    setPreparationNotes("");
    setEstimatedTime("");
  };

  const handleMarkAsReady = async (deliveryId: string) => {
    try {
      await mealPreparationsService.markAsReady(deliveryId);
      await fetchData();
    } catch (error) {
      console.error("Error marking as ready:", error);
    }
  };

  const handleSubmitPreparing = async () => {
    if (!selectedDelivery) return;

    try {
      await mealPreparationsService.markAsPreparing(
        selectedDelivery.deliveryId,
        preparationNotes || undefined,
        preparedBy || undefined,
        estimatedTime ? parseInt(estimatedTime) : undefined
      );
      setShowPreparingModal(false);
      await fetchData();
    } catch (error) {
      console.error("Error marking as preparing:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      scheduled: "outline",
      preparing: "secondary",
      ready: "default",
    };

    const colors: Record<string, string> = {
      scheduled: "text-gray-600",
      preparing: "text-orange-600",
      ready: "text-green-600",
    };

    return (
      <Badge
        variant={variants[status.toLowerCase()] || "secondary"}
        className={colors[status.toLowerCase()]}
      >
        {status.toUpperCase()}
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

  const getStatusCount = (status: string) => {
    return preparations.filter(
      (p) => p.status.toLowerCase() === status.toLowerCase()
    ).length;
  };

  const columns: Column<PreparationItem>[] = [
    {
      key: "deliveryId",
      header: "Delivery ID",
      render: (row) => (
        <div className="font-mono text-sm">
          {row.deliveryId.substring(0, 8)}...
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      render: (row) => (
        <div>
          <div className="font-medium">{row.customerName}</div>
          <div className="text-xs text-gray-500 font-mono">
            {row.profileId.substring(0, 12)}...
          </div>
        </div>
      ),
    },
    {
      key: "meals",
      header: "Meals to Prepare",
      render: (row) => (
        <div className="space-y-2">
          {row.meals.map((meal, idx) => (
            <div key={idx} className="flex items-start gap-2">
              {getMealTypeBadge(meal.mealType)}
              <div className="flex-1">
                <div className="font-medium text-sm">{meal.mealName}</div>
                <div className="text-xs text-gray-500">
                  Time: {meal.mealTime}
                </div>
                {meal.totalCalories && (
                  <div className="text-xs text-gray-500">
                    {meal.totalCalories} kcal
                  </div>
                )}
                {meal.preparationNotes && (
                  <div className="text-xs text-orange-600 italic mt-1">
                    Note: {meal.preparationNotes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "scheduledDeliveryTime",
      header: "Delivery Time",
      render: (row) => {
        const scheduled = new Date(row.scheduledDeliveryTime);
        return (
          <div className="text-sm">
            <div className="font-medium">
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
      key: "specialInstructions",
      header: "Special Instructions",
      render: (row) => (
        <div className="max-w-xs">
          {row.specialInstructions ? (
            <p className="text-sm text-blue-600 italic">
              {row.specialInstructions}
            </p>
          ) : (
            <span className="text-gray-400">None</span>
          )}
        </div>
      ),
    },
    {
      key: "deliveryId",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          {row.status === "scheduled" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleMarkAsPreparing(row)}
            >
              Start Preparing
            </Button>
          )}
          {row.status === "preparing" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleMarkAsReady(row.deliveryId)}
              className="bg-green-600 hover:bg-green-700"
            >
              Mark as Ready
            </Button>
          )}
          {row.status === "ready" && (
            <Badge variant="default" className="bg-green-600">
              Ready for Pickup
            </Badge>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Meals Today
            </CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregation.total}</div>
            <p className="text-xs text-gray-500 mt-1">
              {preparations.length} deliveries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {getStatusCount("scheduled")}
            </div>
            <p className="text-xs text-gray-500 mt-1">Waiting to start</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preparing</CardTitle>
            <Utensils className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {getStatusCount("preparing")}
            </div>
            <p className="text-xs text-gray-500 mt-1">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getStatusCount("ready")}
            </div>
            <p className="text-xs text-gray-500 mt-1">Ready for pickup</p>
          </CardContent>
        </Card>
      </div>

      {/* Meal Type Aggregation */}
      <Card>
        <CardHeader>
          <CardTitle>
            Meal Type Breakdown for{" "}
            {new Date(selectedDate).toLocaleDateString()}
          </CardTitle>
          <CardDescription>
            Total meals by type for the selected date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Breakfast
                </span>
              </div>
              <div className="text-2xl font-bold text-yellow-800">
                {aggregation.breakfast}
              </div>
              <p className="text-xs text-yellow-600 mt-1">meals to prepare</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Lunch
                </span>
              </div>
              <div className="text-2xl font-bold text-green-800">
                {aggregation.lunch}
              </div>
              <p className="text-xs text-green-600 mt-1">meals to prepare</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Dinner
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-800">
                {aggregation.dinner}
              </div>
              <p className="text-xs text-blue-600 mt-1">meals to prepare</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Snack
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-800">
                {aggregation.snack}
              </div>
              <p className="text-xs text-purple-600 mt-1">meals to prepare</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preparation Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Meal Preparation Queue</CardTitle>
              <CardDescription>
                Kitchen preparation queue for selected date and meal type
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1"
              />
            </div>
            <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Meal Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Meal Types</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading preparation queue...</div>
            </div>
          ) : preparations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <ClipboardList className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No meals to prepare</p>
              <p className="text-sm">
                There are no scheduled meals for the selected date and type
              </p>
            </div>
          ) : (
            <DataTable<PreparationItem>
              columns={columns}
              data={preparations}
              searchable={false}
            />
          )}

          {/* Summary */}
          {!loading && preparations.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Preparation Summary
                  </span>
                </div>
                <div className="text-sm text-blue-800">
                  {getStatusCount("scheduled")} to start •{" "}
                  {getStatusCount("preparing")} in progress •{" "}
                  {getStatusCount("ready")} ready
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mark as Preparing Modal */}
      <Dialog open={showPreparingModal} onOpenChange={setShowPreparingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Meal Preparation</DialogTitle>
            <DialogDescription>
              Mark this delivery as being prepared. Add optional details about
              the preparation.
            </DialogDescription>
          </DialogHeader>

          {selectedDelivery && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedDelivery.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Meals</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedDelivery.meals.map((meal, idx) => (
                      <span key={idx} className="text-sm">
                        {getMealTypeBadge(meal.mealType)} {meal.mealName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Prepared By (optional)
                </label>
                <Input
                  placeholder="Chef's name"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Estimated Time (minutes, optional)
                </label>
                <Input
                  type="number"
                  placeholder="30"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Preparation Notes (optional)
                </label>
                <Input
                  placeholder="Any special notes..."
                  value={preparationNotes}
                  onChange={(e) => setPreparationNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPreparingModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitPreparing}>Start Preparing</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
