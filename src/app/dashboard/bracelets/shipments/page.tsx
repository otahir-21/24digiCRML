"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import {
  Search,
  Truck,
  Package,
  MapPin,
  Clock,
  ExternalLink,
  RefreshCw,
  Download,
  Eye,
  Edit3,
  Calendar,
  CheckCircle,
  DollarSign,
  MoreHorizontal,
  Plus,
  FileText,
} from "lucide-react";
import Link from "next/link";
import {
  braceletShipmentService,
  BraceletShipment,
  DeliveryPerformanceReport,
  AvailableCarrier,
} from "@/lib/services/bracelet-shipment.service";

export default function BraceletShipmentsPage() {
  const { toast } = useToast();
  const [shipments, setShipments] = useState<BraceletShipment[]>([]);
  const [report, setReport] = useState<DeliveryPerformanceReport | null>(null);
  const [carriers, setCarriers] = useState<AvailableCarrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page] = useState(1);
  const [, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("shipments");

  // Selected shipment for tracking detail
  const [selectedShipment, setSelectedShipment] =
    useState<BraceletShipment | null>(null);
  const [showTrackingDetail, setShowTrackingDetail] = useState(false);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        status: statusFilter === "all" ? undefined : statusFilter,
        carrier: carrierFilter === "all" ? undefined : carrierFilter,
        page,
        limit: 20,
        sortBy,
        sortOrder: sortOrder as "asc" | "desc",
      };

      const [shipmentsResponse, reportResponse, carriersResponse] =
        await Promise.all([
          braceletShipmentService.getShipments(filters),
          braceletShipmentService.getDeliveryPerformanceReport(),
          braceletShipmentService.getAvailableCarriers(),
        ]);

      setShipments(shipmentsResponse.shipments);
      setTotalPages(shipmentsResponse.totalPages);
      setReport(reportResponse);
      setCarriers(carriersResponse);
    } catch (error) {
      console.error("Error fetching shipments:", error);

      // Fallback to mock data
      const mockShipments: BraceletShipment[] = [
        {
          shipmentId: "SHP001",
          orderId: "BR24090001",
          customerId: "CUST001",
          trackingNumber: "UPS12345678901",
          carrierTrackingUrl: "https://ups.com/tracking/12345678901",
          carrier: {
            carrierId: "ups",
            name: "UPS",
            serviceType: "ground",
            serviceName: "UPS Ground",
            estimatedDays: 3,
            guaranteedDelivery: false,
            weekendDelivery: false,
            signatureRequired: false,
            insuranceIncluded: true,
            trackingIncluded: true,
          },
          fromAddress: {
            name: "Bracelet Store Warehouse",
            company: "Bracelet Co.",
            addressLine1: "123 Warehouse St",
            city: "Los Angeles",
            state: "CA",
            postalCode: "90210",
            country: "US",
          },
          toAddress: {
            name: "John Doe",
            addressLine1: "456 Main St",
            city: "New York",
            state: "NY",
            postalCode: "10001",
            country: "US",
            phone: "+1234567890",
          },
          packageDimensions: {
            length: 8,
            width: 6,
            height: 2,
            weight: 0.5,
            unit: "imperial",
          },
          requiresSignature: false,
          requiresAdultSignature: false,
          isInsured: true,
          insuranceValue: 299,
          status: "in_transit",
          shippedDate: new Date("2024-09-21T10:00:00Z"),
          estimatedDeliveryDate: new Date("2024-09-24T17:00:00Z"),
          baseCost: 12.5,
          totalCost: 12.5,
          currency: "USD",
          currentLocation: "Chicago, IL",
          lastTracked: new Date("2024-09-22T14:30:00Z"),
          trackingEvents: [
            {
              eventId: "EVT001",
              status: "Label Created",
              description: "Shipping label created",
              timestamp: new Date("2024-09-21T09:00:00Z"),
              location: "Los Angeles, CA",
            },
            {
              eventId: "EVT002",
              status: "Picked Up",
              description: "Package picked up by UPS",
              timestamp: new Date("2024-09-21T15:00:00Z"),
              location: "Los Angeles, CA",
            },
            {
              eventId: "EVT003",
              status: "In Transit",
              description: "Package in transit to destination",
              timestamp: new Date("2024-09-22T08:00:00Z"),
              location: "Chicago, IL",
            },
          ],
          createdAt: "2024-09-21T09:00:00Z",
          updatedAt: "2024-09-22T14:30:00Z",
        },
        {
          shipmentId: "SHP002",
          orderId: "BR24090002",
          customerId: "CUST002",
          trackingNumber: "FEDEX98765432101",
          carrierTrackingUrl: "https://fedex.com/tracking/98765432101",
          carrier: {
            carrierId: "fedex",
            name: "FedEx",
            serviceType: "express",
            serviceName: "FedEx 2Day",
            estimatedDays: 2,
            guaranteedDelivery: true,
            weekendDelivery: false,
            signatureRequired: true,
            insuranceIncluded: true,
            trackingIncluded: true,
          },
          fromAddress: {
            name: "Bracelet Store Warehouse",
            company: "Bracelet Co.",
            addressLine1: "123 Warehouse St",
            city: "Los Angeles",
            state: "CA",
            postalCode: "90210",
            country: "US",
          },
          toAddress: {
            name: "Jane Smith",
            addressLine1: "789 Oak Ave",
            city: "Miami",
            state: "FL",
            postalCode: "33101",
            country: "US",
            phone: "+1987654321",
          },
          packageDimensions: {
            length: 6,
            width: 4,
            height: 1,
            weight: 0.3,
            unit: "imperial",
          },
          requiresSignature: true,
          requiresAdultSignature: false,
          isInsured: true,
          insuranceValue: 179,
          status: "delivered",
          shippedDate: new Date("2024-09-20T14:00:00Z"),
          estimatedDeliveryDate: new Date("2024-09-22T17:00:00Z"),
          actualDeliveryDate: new Date("2024-09-22T11:30:00Z"),
          baseCost: 18.95,
          totalCost: 18.95,
          currency: "USD",
          currentLocation: "Delivered",
          lastTracked: new Date("2024-09-22T11:30:00Z"),
          trackingEvents: [
            {
              eventId: "EVT004",
              status: "Label Created",
              description: "Shipping label created",
              timestamp: new Date("2024-09-20T13:00:00Z"),
              location: "Los Angeles, CA",
            },
            {
              eventId: "EVT005",
              status: "Picked Up",
              description: "Package picked up by FedEx",
              timestamp: new Date("2024-09-20T17:00:00Z"),
              location: "Los Angeles, CA",
            },
            {
              eventId: "EVT006",
              status: "In Transit",
              description: "At FedEx facility",
              timestamp: new Date("2024-09-21T22:00:00Z"),
              location: "Memphis, TN",
            },
            {
              eventId: "EVT007",
              status: "Out for Delivery",
              description: "Out for delivery",
              timestamp: new Date("2024-09-22T08:00:00Z"),
              location: "Miami, FL",
            },
            {
              eventId: "EVT008",
              status: "Delivered",
              description: "Delivered to recipient",
              timestamp: new Date("2024-09-22T11:30:00Z"),
              location: "Miami, FL",
              signedBy: "J. SMITH",
            },
          ],
          onTimeDelivery: true,
          deliveryDelayDays: 0,
          createdAt: "2024-09-20T13:00:00Z",
          updatedAt: "2024-09-22T11:30:00Z",
        },
      ];

      setShipments(mockShipments);
      setReport({
        summary: {
          totalShipments: 2,
          deliveredShipments: 1,
          pendingShipments: 1,
          exceptionShipments: 0,
          onTimeDeliveryRate: 100,
          averageDeliveryTime: 2.5,
          totalShippingCost: 31.45,
        },
        carrierPerformance: [
          {
            carrier: "UPS",
            totalShipments: 1,
            onTimeRate: 95,
            averageDeliveryTime: 3.2,
            exceptionRate: 2.1,
            averageCost: 12.5,
          },
          {
            carrier: "FedEx",
            totalShipments: 1,
            onTimeRate: 98,
            averageDeliveryTime: 2.1,
            exceptionRate: 1.5,
            averageCost: 18.95,
          },
        ],
        trends: {
          daily: [],
          monthly: [],
        },
      });
      setCarriers([
        {
          carrierId: "ups",
          name: "UPS",
          services: [
            {
              serviceId: "ups_ground",
              name: "UPS Ground",
              description: "Economical ground delivery",
              estimatedDays: 3,
              features: ["Tracking", "Insurance"],
              baseRate: 10.5,
            },
          ],
          trackingSupported: true,
          pickupSupported: true,
          internationalSupported: true,
          maxWeight: 150,
          maxDimensions: {
            length: 48,
            width: 48,
            height: 48,
            weight: 150,
            unit: "imperial",
          },
        },
      ]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, carrierFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      created: {
        label: "Created",
        variant: "secondary" as const,
        color: "bg-gray-500",
      },
      label_created: {
        label: "Label Created",
        variant: "secondary" as const,
        color: "bg-blue-500",
      },
      pickup_scheduled: {
        label: "Pickup Scheduled",
        variant: "secondary" as const,
        color: "bg-purple-500",
      },
      picked_up: {
        label: "Picked Up",
        variant: "default" as const,
        color: "bg-indigo-500",
      },
      in_transit: {
        label: "In Transit",
        variant: "default" as const,
        color: "bg-yellow-500",
      },
      out_for_delivery: {
        label: "Out for Delivery",
        variant: "default" as const,
        color: "bg-orange-500",
      },
      delivered: {
        label: "Delivered",
        variant: "default" as const,
        color: "bg-green-500",
      },
      exception: {
        label: "Exception",
        variant: "destructive" as const,
        color: "bg-red-500",
      },
      returned: {
        label: "Returned",
        variant: "destructive" as const,
        color: "bg-red-400",
      },
      cancelled: {
        label: "Cancelled",
        variant: "outline" as const,
        color: "bg-gray-400",
      },
    };

    return (
      statusConfig[status as keyof typeof statusConfig] || statusConfig.created
    );
  };

  const handleRefreshTracking = async (shipmentId: string) => {
    try {
      await braceletShipmentService.refreshTrackingData(shipmentId);
      toast({
        title: "Success",
        description: "Tracking data refreshed successfully",
      });
      fetchShipments();
    } catch (error) {
      console.error("Error refreshing tracking:", error);
      toast({
        title: "Error",
        description: "Failed to refresh tracking data",
        variant: "destructive",
      });
    }
  };

  const openTrackingDetail = (shipment: BraceletShipment) => {
    setSelectedShipment(shipment);
    setShowTrackingDetail(true);
  };

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch =
      shipment.shipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shipment.trackingNumber &&
        shipment.trackingNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      shipment.toAddress.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || shipment.status === statusFilter;
    const matchesCarrier =
      carrierFilter === "all" ||
      shipment.carrier.name.toLowerCase() === carrierFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCarrier;
  });

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Shipment Management
          </h1>
          <p className="text-muted-foreground">
            Track shipments, manage deliveries, and monitor carrier performance
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => fetchShipments()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Shipment
          </Button>
        </div>
      </div>

      {/* Performance Stats */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Shipments
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {report.summary.totalShipments}
              </div>
              <p className="text-xs text-muted-foreground">
                {report.summary.pendingShipments} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                On-Time Delivery
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {report.summary.onTimeDeliveryRate}%
              </div>
              <p className="text-xs text-green-600">
                {report.summary.deliveredShipments} delivered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Delivery Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {report.summary.averageDeliveryTime} days
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Shipping Cost
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${report.summary.totalShippingCost.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="carriers">Carriers</TabsTrigger>
        </TabsList>

        <TabsContent value="shipments" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search shipments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="created">Created</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="out_for_delivery">
                        Out for Delivery
                      </SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="exception">Exception</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Carrier</label>
                  <Select
                    value={carrierFilter}
                    onValueChange={setCarrierFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Carriers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Carriers</SelectItem>
                      <SelectItem value="ups">UPS</SelectItem>
                      <SelectItem value="fedex">FedEx</SelectItem>
                      <SelectItem value="usps">USPS</SelectItem>
                      <SelectItem value="dhl">DHL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select
                    value={`${sortBy}-${sortOrder}`}
                    onValueChange={(value) => {
                      const [field, order] = value.split("-");
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt-desc">
                        Newest First
                      </SelectItem>
                      <SelectItem value="createdAt-asc">
                        Oldest First
                      </SelectItem>
                      <SelectItem value="estimatedDeliveryDate-asc">
                        Delivery Date
                      </SelectItem>
                      <SelectItem value="totalCost-desc">
                        Highest Cost
                      </SelectItem>
                      <SelectItem value="status-asc">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Actions</label>
                  <Button variant="outline" size="sm" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Bulk Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Shipments ({filteredShipments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipment ID</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Tracking Number</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Estimated Delivery</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => {
                    const statusBadge = getStatusBadge(shipment.status);

                    return (
                      <TableRow key={shipment.shipmentId}>
                        <TableCell className="font-mono">
                          {shipment.shipmentId}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/bracelets/orders/${shipment.orderId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {shipment.orderId}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {shipment.trackingNumber ? (
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm">
                                {shipment.trackingNumber}
                              </span>
                              {shipment.carrierTrackingUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      shipment.carrierTrackingUrl,
                                      "_blank"
                                    )
                                  }
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">Pending</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {shipment.carrier.name}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {shipment.carrier.serviceName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {shipment.toAddress.city},{" "}
                              {shipment.toAddress.state}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusBadge.variant}
                            className={statusBadge.color}
                          >
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {shipment.estimatedDeliveryDate ? (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {new Date(
                                  shipment.estimatedDeliveryDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">TBD</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${shipment.totalCost.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openTrackingDetail(shipment)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Tracking
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRefreshTracking(shipment.shipmentId)
                                }
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh Tracking
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit Shipment
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="h-4 w-4 mr-2" />
                                View Label
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {report && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Carrier Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {report.carrierPerformance.map((carrier) => (
                      <div key={carrier.carrier} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{carrier.carrier}</span>
                          <span className="text-sm text-gray-500">
                            {carrier.totalShipments} shipments
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">On-Time Rate</div>
                            <div className="font-medium text-green-600">
                              {carrier.onTimeRate}%
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Avg Delivery</div>
                            <div className="font-medium">
                              {carrier.averageDeliveryTime} days
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Avg Cost</div>
                            <div className="font-medium">
                              ${carrier.averageCost.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Summary Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">
                        Total Shipments
                      </span>
                      <span className="font-semibold">
                        {report.summary.totalShipments}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Delivered</span>
                      <span className="font-semibold text-green-600">
                        {report.summary.deliveredShipments}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Pending</span>
                      <span className="font-semibold text-yellow-600">
                        {report.summary.pendingShipments}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Exceptions</span>
                      <span className="font-semibold text-red-600">
                        {report.summary.exceptionShipments}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">Total Cost</span>
                      <span className="font-semibold">
                        ${report.summary.totalShippingCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="carriers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carriers.map((carrier) => (
              <Card key={carrier.carrierId}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Truck className="h-5 w-5" />
                    <span>{carrier.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Max Weight</div>
                      <div className="font-medium">{carrier.maxWeight} lbs</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Services</div>
                      <div className="font-medium">
                        {carrier.services.length}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Features</div>
                    <div className="flex flex-wrap gap-1">
                      {carrier.trackingSupported && (
                        <Badge variant="outline" className="text-xs">
                          Tracking
                        </Badge>
                      )}
                      {carrier.pickupSupported && (
                        <Badge variant="outline" className="text-xs">
                          Pickup
                        </Badge>
                      )}
                      {carrier.internationalSupported && (
                        <Badge variant="outline" className="text-xs">
                          International
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Services</div>
                    {carrier.services.slice(0, 2).map((service) => (
                      <div key={service.serviceId} className="text-sm">
                        <div className="flex items-center justify-between">
                          <span>{service.name}</span>
                          <span className="text-gray-500">
                            {service.estimatedDays}d
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {service.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Tracking Detail Panel */}
      {showTrackingDetail && selectedShipment && (
        <Card className="fixed top-4 right-4 w-96 max-h-[80vh] overflow-y-auto z-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tracking Details</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTrackingDetail(false)}
              >
                ×
              </Button>
            </CardTitle>
            <CardDescription>
              {selectedShipment.trackingNumber || selectedShipment.shipmentId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Current Status</div>
              <div className="flex items-center space-x-2">
                {(() => {
                  const statusBadge = getStatusBadge(selectedShipment.status);
                  return (
                    <Badge
                      variant={statusBadge.variant}
                      className={statusBadge.color}
                    >
                      {statusBadge.label}
                    </Badge>
                  );
                })()}
              </div>
              {selectedShipment.currentLocation && (
                <div className="text-sm text-gray-500">
                  Last seen: {selectedShipment.currentLocation}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Delivery Information</div>
              <div className="space-y-1 text-sm">
                <div>To: {selectedShipment.toAddress.name}</div>
                <div className="text-gray-500">
                  {selectedShipment.toAddress.city},{" "}
                  {selectedShipment.toAddress.state}
                </div>
                {selectedShipment.estimatedDeliveryDate && (
                  <div>
                    Estimated:{" "}
                    {new Date(
                      selectedShipment.estimatedDeliveryDate
                    ).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {selectedShipment.trackingEvents &&
              selectedShipment.trackingEvents.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Tracking History</div>
                  <div className="space-y-3">
                    {selectedShipment.trackingEvents
                      .sort(
                        (a, b) =>
                          new Date(b.timestamp).getTime() -
                          new Date(a.timestamp).getTime()
                      )
                      .map((event, index) => (
                        <div
                          key={event.eventId}
                          className="flex items-start space-x-3"
                        >
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            {index <
                              selectedShipment.trackingEvents!.length - 1 && (
                              <div className="w-0.5 h-8 bg-gray-200 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="text-sm font-medium">
                              {event.status}
                            </div>
                            <div className="text-xs text-gray-500">
                              {event.description}
                            </div>
                            {event.location && (
                              <div className="text-xs text-gray-500 flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {event.location}
                              </div>
                            )}
                            <div className="text-xs text-gray-400">
                              {new Date(event.timestamp).toLocaleString()}
                            </div>
                            {event.signedBy && (
                              <div className="text-xs text-green-600">
                                Signed by: {event.signedBy}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() =>
                  handleRefreshTracking(selectedShipment.shipmentId)
                }
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              {selectedShipment.carrierTrackingUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(selectedShipment.carrierTrackingUrl, "_blank")
                  }
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
