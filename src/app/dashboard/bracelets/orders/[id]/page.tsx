"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Package,
  Truck,
  CreditCard,
  User,
  MapPin,
  Clock,
  MessageSquare,
  Mail,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Printer,
  FileText,
  DollarSign,
  Phone,
  Building,
  Gift,
} from "lucide-react";
import {
  braceletOrderService,
  BraceletOrder,
  CreateShipmentDto,
} from "@/lib/services/bracelet-order.service";

interface TimelineEvent {
  id: string;
  event: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
  color: string;
}

export default function BraceletOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = params.id as string;

  const [order, setOrder] = useState<BraceletOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showShipmentDialog, setShowShipmentDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [shipmentData, setShipmentData] = useState<CreateShipmentDto>({
    carrier: "",
    trackingNumber: "",
    method: "standard",
    cost: 0,
  });
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  useEffect(() => {
    fetchOrderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const data = await braceletOrderService.getOrderById(orderId);
      setOrder(data);
      setAdminNotes(data.adminNotes || "");
    } catch {
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await braceletOrderService.updateOrderStatus(orderId, {
        status: newStatus,
        notifyCustomer: true,
      });
      await fetchOrderDetails();
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmOrder = async () => {
    setUpdating(true);
    try {
      await braceletOrderService.confirmOrder(orderId);
      await fetchOrderDetails();
      toast({
        title: "Success",
        description: "Order confirmed successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to confirm order",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateShipment = async () => {
    setUpdating(true);
    try {
      await braceletOrderService.createShipment(orderId, shipmentData);
      await fetchOrderDetails();
      setShowShipmentDialog(false);
      toast({
        title: "Success",
        description: "Shipment created successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to create shipment",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkDelivered = async () => {
    setUpdating(true);
    try {
      await braceletOrderService.markAsDelivered(orderId);
      await fetchOrderDetails();
      toast({
        title: "Success",
        description: "Order marked as delivered",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update delivery status",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleProcessRefund = async () => {
    setUpdating(true);
    try {
      await braceletOrderService.processRefund(orderId, {
        amount: parseFloat(refundAmount),
        reason: refundReason,
        notifyCustomer: true,
      });
      await fetchOrderDetails();
      setShowRefundDialog(false);
      toast({
        title: "Success",
        description: "Refund processed successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to process refund",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    setUpdating(true);
    try {
      await braceletOrderService.addAdminNotes(orderId, adminNotes);
      setShowNotesDialog(false);
      toast({
        title: "Success",
        description: "Notes saved successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const blob = await braceletOrderService.getInvoice(orderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  const handlePrintLabel = async () => {
    try {
      const blob = await braceletOrderService.getShippingLabel(orderId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      window.URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate shipping label",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      case "confirmed":
      case "processing":
        return <Package className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
      case "refunded":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const generateTimeline = (): TimelineEvent[] => {
    if (!order) return [];

    const timeline: TimelineEvent[] = [
      {
        id: "1",
        event: "Order Placed",
        description: `Order #${order.orderId} was placed`,
        timestamp: String(order.createdAt),
        icon: <Package className="h-4 w-4" />,
        color: "bg-blue-500",
      },
    ];

    if (order.paymentStatus === "succeeded") {
      const paymentDate = order.paymentInfo?.paymentDate || order.createdAt;
      timeline.push({
        id: "2",
        event: "Payment Received",
        description: `Payment of $${order.totalAmount.toFixed(2)} received`,
        timestamp: String(paymentDate),
        icon: <CreditCard className="h-4 w-4" />,
        color: "bg-green-500",
      });
    }

    if (
      order.status === "confirmed" ||
      ["processing", "shipped", "delivered"].includes(order.status)
    ) {
      timeline.push({
        id: "3",
        event: "Order Confirmed",
        description: "Order confirmed and inventory reserved",
        timestamp: String(order.updatedAt),
        icon: <CheckCircle className="h-4 w-4" />,
        color: "bg-blue-500",
      });
    }

    if (["processing", "shipped", "delivered"].includes(order.status)) {
      timeline.push({
        id: "4",
        event: "Processing Started",
        description: "Order is being prepared for shipment",
        timestamp: String(order.updatedAt),
        icon: <Package className="h-4 w-4" />,
        color: "bg-indigo-500",
      });
    }

    if (["shipped", "delivered"].includes(order.status) && order.shippingInfo) {
      timeline.push({
        id: "5",
        event: "Order Shipped",
        description: `Shipped via ${order.shippingInfo.carrier} - ${order.shippingInfo.trackingNumber}`,
        timestamp: String(order.updatedAt),
        icon: <Truck className="h-4 w-4" />,
        color: "bg-purple-500",
      });
    }

    if (order.status === "delivered" && order.shippingInfo?.actualDelivery) {
      timeline.push({
        id: "6",
        event: "Order Delivered",
        description: order.shippingInfo.signedBy
          ? `Delivered and signed by ${order.shippingInfo.signedBy}`
          : "Order delivered successfully",
        timestamp: order.shippingInfo.actualDelivery.toString(),
        icon: <CheckCircle className="h-4 w-4" />,
        color: "bg-green-500",
      });
    }

    if (order.status === "cancelled") {
      timeline.push({
        id: "7",
        event: "Order Cancelled",
        description: "Order was cancelled",
        timestamp: String(order.updatedAt),
        icon: <XCircle className="h-4 w-4" />,
        color: "bg-red-500",
      });
    }

    if (order.paymentStatus === "refunded") {
      const refundDate = order.paymentInfo?.refundDate?.toString() || order.updatedAt;
      timeline.push({
        id: "8",
        event: "Refund Processed",
        description: `Refund of $${
          order.paymentInfo?.refundAmount?.toFixed(2) ||
          order.totalAmount.toFixed(2)
        } processed`,
        timestamp: String(refundDate),
        icon: <DollarSign className="h-4 w-4" />,
        color: "bg-orange-500",
      });
    }

    return timeline.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Order Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The order {`you're`} looking for {`doesn't`} exist or has been
                removed.
              </p>
              <Button
                onClick={() => router.push("/dashboard/bracelets/orders")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timeline = generateTimeline();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/bracelets/orders")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <div>
            <h1 className="text-2xl font-bold">Order #{order.orderId}</h1>
            <p className="text-muted-foreground">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleDownloadInvoice}>
            <FileText className="h-4 w-4 mr-2" />
            Invoice
          </Button>
          {order.status === "processing" && (
            <Button variant="outline" size="sm" onClick={handlePrintLabel}>
              <Printer className="h-4 w-4 mr-2" />
              Print Label
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchOrderDetails}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order Status</CardTitle>
                <Badge
                  variant={
                    order.status === "delivered"
                      ? "default"
                      : order.status === "cancelled" ||
                        order.status === "refunded"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {getStatusIcon(order.status)}
                  <span className="ml-2">{order.status.toUpperCase()}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Payment Status
                </span>
                <Badge
                  variant={
                    order.paymentStatus === "succeeded"
                      ? "default"
                      : order.paymentStatus === "failed" ||
                        order.paymentStatus === "refunded"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {order.paymentStatus.toUpperCase()}
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4">
                {order.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={handleConfirmOrder}
                    disabled={updating}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Order
                  </Button>
                )}
                {order.status === "confirmed" && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus("processing")}
                    disabled={updating}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Start Processing
                  </Button>
                )}
                {order.status === "processing" && (
                  <Button
                    size="sm"
                    onClick={() => setShowShipmentDialog(true)}
                    disabled={updating}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Create Shipment
                  </Button>
                )}
                {order.status === "shipped" && (
                  <Button
                    size="sm"
                    onClick={handleMarkDelivered}
                    disabled={updating}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Delivered
                  </Button>
                )}
                {["pending", "confirmed", "processing"].includes(
                  order.status
                ) && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleUpdateStatus("cancelled")}
                    disabled={updating}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Order
                  </Button>
                )}
                {order.paymentStatus === "succeeded" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowRefundDialog(true)}
                    disabled={updating}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Process Refund
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 pb-4 border-b last:border-0"
                  >
                    {item.productImage && (
                      <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          width={80}
                          height={80}
                          className="object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium">{item.productName}</h4>
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.sku} | Size: {item.size} | Color:{" "}
                        {item.color}
                      </p>
                      {item.customizations &&
                        item.customizations.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            {item.customizations.map((custom, idx) => (
                              <div key={idx}>
                                {custom.optionName}: {custom.value} (+$
                                {custom.additionalPrice})
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${item.totalPrice.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${item.unitPrice.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}

                <Separator />

                {/* Price Summary */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-${order.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>${order.shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${order.taxAmount.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          {order.shippingInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Carrier
                    </p>
                    <p className="font-medium">{order.shippingInfo.carrier}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Method
                    </p>
                    <p className="font-medium">{order.shippingInfo.method}</p>
                  </div>
                  {order.shippingInfo.trackingNumber && (
                    <>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Tracking Number
                        </p>
                        <p className="font-mono text-sm">
                          {order.shippingInfo.trackingNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Status
                        </p>
                        <Badge>
                          {order.shippingInfo.status || "In Transit"}
                        </Badge>
                      </div>
                    </>
                  )}
                  {order.shippingInfo.estimatedDelivery && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Estimated Delivery
                      </p>
                      <p className="font-medium">
                        {new Date(
                          order.shippingInfo.estimatedDelivery
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {order.shippingInfo.actualDelivery && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Actual Delivery
                      </p>
                      <p className="font-medium">
                        {new Date(
                          order.shippingInfo.actualDelivery
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
                {order.shippingInfo.trackingUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(order.shippingInfo?.trackingUrl, "_blank")
                    }
                  >
                    Track Package
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={event.id} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full ${event.color} flex items-center justify-center text-white`}
                      >
                        {event.icon}
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="w-0.5 h-16 bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <h4 className="font-medium">{event.event}</h4>
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">
                  {order.billingAddress.firstName}{" "}
                  {order.billingAddress.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{order.billingAddress.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{order.billingAddress.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer ID</p>
                <p className="font-mono text-sm">{order.customerId}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Addresses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="shipping">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="shipping">Shipping</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                </TabsList>
                <TabsContent value="shipping" className="space-y-2">
                  <p className="font-medium">
                    {order.shippingAddress.firstName}{" "}
                    {order.shippingAddress.lastName}
                  </p>
                  {order.shippingAddress.company && (
                    <p className="text-sm text-muted-foreground">
                      <Building className="h-3 w-3 inline mr-1" />
                      {order.shippingAddress.company}
                    </p>
                  )}
                  <p className="text-sm">
                    {order.shippingAddress.addressLine1}
                  </p>
                  {order.shippingAddress.addressLine2 && (
                    <p className="text-sm">
                      {order.shippingAddress.addressLine2}
                    </p>
                  )}
                  <p className="text-sm">
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p className="text-sm">{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && (
                    <p className="text-sm text-muted-foreground">
                      <Phone className="h-3 w-3 inline mr-1" />
                      {order.shippingAddress.phone}
                    </p>
                  )}
                  {order.shippingAddress.deliveryInstructions && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground">
                        Delivery Instructions
                      </p>
                      <p className="text-sm">
                        {order.shippingAddress.deliveryInstructions}
                      </p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="billing" className="space-y-2">
                  <p className="font-medium">
                    {order.billingAddress.firstName}{" "}
                    {order.billingAddress.lastName}
                  </p>
                  <p className="text-sm">{order.billingAddress.addressLine1}</p>
                  {order.billingAddress.addressLine2 && (
                    <p className="text-sm">
                      {order.billingAddress.addressLine2}
                    </p>
                  )}
                  <p className="text-sm">
                    {order.billingAddress.city}, {order.billingAddress.state}{" "}
                    {order.billingAddress.postalCode}
                  </p>
                  <p className="text-sm">{order.billingAddress.country}</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Payment Information */}
          {order.paymentInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Method</p>
                  <p className="font-medium capitalize">
                    {order.paymentInfo.method}
                  </p>
                </div>
                {order.paymentInfo.cardBrand && (
                  <div>
                    <p className="text-sm text-muted-foreground">Card</p>
                    <p className="font-medium">
                      {order.paymentInfo.cardBrand.toUpperCase()} ••••{" "}
                      {order.paymentInfo.last4Digits}
                    </p>
                  </div>
                )}
                {order.paymentInfo.stripePaymentIntentId && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Transaction ID
                    </p>
                    <p className="font-mono text-xs break-all">
                      {order.paymentInfo.stripePaymentIntentId}
                    </p>
                  </div>
                )}
                {order.paymentInfo.paymentDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Payment Date
                    </p>
                    <p className="text-sm">
                      {new Date(order.paymentInfo.paymentDate).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Notes
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNotesDialog(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Customer Notes
                  </p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
              {order.giftMessage && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    <Gift className="h-3 w-3 inline mr-1" />
                    Gift Message
                  </p>
                  <p className="text-sm italic">{order.giftMessage}</p>
                </div>
              )}
              {order.adminNotes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Admin Notes
                  </p>
                  <p className="text-sm">{order.adminNotes}</p>
                </div>
              )}
              {!order.notes && !order.adminNotes && !order.giftMessage && (
                <p className="text-sm text-muted-foreground">
                  No notes available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Shipment Dialog */}
      <Dialog open={showShipmentDialog} onOpenChange={setShowShipmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Shipment</DialogTitle>
            <DialogDescription>
              Enter shipping details to create a shipment for this order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="carrier">Carrier</Label>
              <Select
                value={shipmentData.carrier}
                onValueChange={(value) =>
                  setShipmentData({ ...shipmentData, carrier: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ups">UPS</SelectItem>
                  <SelectItem value="fedex">FedEx</SelectItem>
                  <SelectItem value="dhl">DHL</SelectItem>
                  <SelectItem value="usps">USPS</SelectItem>
                  <SelectItem value="aramex">Aramex</SelectItem>
                  <SelectItem value="emirates-post">Emirates Post</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tracking">Tracking Number</Label>
              <Input
                id="tracking"
                value={shipmentData.trackingNumber}
                onChange={(e) =>
                  setShipmentData({
                    ...shipmentData,
                    trackingNumber: e.target.value,
                  })
                }
                placeholder="Enter tracking number"
              />
            </div>
            <div>
              <Label htmlFor="method">Shipping Method</Label>
              <Select
                value={shipmentData.method}
                onValueChange={(value) =>
                  setShipmentData({ ...shipmentData, method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="express">Express</SelectItem>
                  <SelectItem value="overnight">Overnight</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cost">Shipping Cost</Label>
              <Input
                id="cost"
                type="number"
                value={shipmentData.cost}
                onChange={(e) =>
                  setShipmentData({
                    ...shipmentData,
                    cost: parseFloat(e.target.value),
                  })
                }
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowShipmentDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateShipment}
              disabled={
                updating ||
                !shipmentData.carrier ||
                !shipmentData.trackingNumber
              }
            >
              Create Shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Enter refund details for this order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="refundAmount">Refund Amount</Label>
              <Input
                id="refundAmount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder={order?.totalAmount.toFixed(2)}
                max={order?.totalAmount}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum: ${order?.totalAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <Label htmlFor="refundReason">Reason</Label>
              <Textarea
                id="refundReason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter refund reason..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRefundDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessRefund}
              disabled={updating || !refundAmount || !refundReason}
              variant="destructive"
            >
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Notes</DialogTitle>
            <DialogDescription>
              Add or update internal notes for this order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Enter admin notes..."
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes} disabled={updating}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
