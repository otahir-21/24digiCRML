"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Truck,
  Package,
  MapPin,
  Clock,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Navigation,
} from "lucide-react";
import { braceletOrderService } from "@/lib/services/bracelet-order.service";

interface TrackingEvent {
  timestamp: Date;
  location: string;
  status: string;
  description: string;
}

interface ShippingInfo {
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  status: string;
  events: TrackingEvent[];
}

interface ShippingTrackerProps {
  orderId: string;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
}

export function ShippingTracker({
  orderId,
  trackingNumber,
  carrier,
  trackingUrl,
  estimatedDelivery,
  actualDelivery,
}: ShippingTrackerProps) {
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrackingInfo = async () => {
    if (!trackingNumber) return;

    setLoading(true);
    setError(null);

    try {
      const data = await braceletOrderService.getShipmentTracking(orderId);
      setShippingInfo(data);
    } catch (err) {
      setError("Failed to fetch tracking information");
      console.error("Tracking error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, trackingNumber]);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("delivered")) return "bg-green-500";
    if (statusLower.includes("transit") || statusLower.includes("shipped"))
      return "bg-blue-500";
    if (statusLower.includes("processing") || statusLower.includes("preparing"))
      return "bg-yellow-500";
    if (statusLower.includes("exception") || statusLower.includes("failed"))
      return "bg-red-500";
    return "bg-gray-500";
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("delivered"))
      return <CheckCircle className="h-4 w-4" />;
    if (statusLower.includes("transit") || statusLower.includes("shipped"))
      return <Truck className="h-4 w-4" />;
    if (statusLower.includes("exception") || statusLower.includes("failed"))
      return <AlertTriangle className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  };

  const formatEventTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  if (!trackingNumber) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="h-5 w-5 mr-2" />
            Shipping Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No tracking information available</p>
            <p className="text-sm">This order {`hasn't`} been shipped yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Truck className="h-5 w-5 mr-2" />
            Shipping Tracker
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTrackingInfo}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Carrier</p>
            <p className="font-semibold">{carrier}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Tracking Number</p>
            <p className="font-mono text-sm">{trackingNumber}</p>
          </div>
          {estimatedDelivery && (
            <div>
              <p className="text-sm font-medium text-gray-600">
                Estimated Delivery
              </p>
              <p className="text-sm">
                <Clock className="h-3 w-3 inline mr-1" />
                {new Date(estimatedDelivery).toLocaleDateString()}
              </p>
            </div>
          )}
          {actualDelivery && (
            <div>
              <p className="text-sm font-medium text-gray-600">Delivered On</p>
              <p className="text-sm text-green-600 font-medium">
                <CheckCircle className="h-3 w-3 inline mr-1" />
                {new Date(actualDelivery).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {trackingUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(trackingUrl, "_blank")}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Track on {carrier} Website
          </Button>
        )}

        <Separator />

        {/* Current Status */}
        {shippingInfo && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">
                Current Status
              </p>
              <Badge
                variant="outline"
                className={`${getStatusColor(
                  shippingInfo.status
                )} text-white border-none`}
              >
                {getStatusIcon(shippingInfo.status)}
                <span className="ml-2">{shippingInfo.status}</span>
              </Badge>
            </div>

            {/* Tracking Events */}
            {shippingInfo.events && shippingInfo.events.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-4">
                  Tracking History
                </p>
                <div className="space-y-4">
                  {shippingInfo.events.map((event, index) => {
                    const { date, time } = formatEventTime(event.timestamp);

                    return (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full ${getStatusColor(
                              event.status
                            )} flex items-center justify-center text-white`}
                          >
                            {getStatusIcon(event.status)}
                          </div>
                          {index < shippingInfo.events.length - 1 && (
                            <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-sm">
                                {event.status}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {event.description}
                              </p>
                              {event.location && (
                                <p className="text-xs text-gray-500 mt-1 flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {event.location}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-xs text-gray-500 ml-4">
                              <div>{date}</div>
                              <div>{time}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTrackingInfo}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-gray-500">
              Loading tracking information...
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          shippingInfo &&
          (!shippingInfo.events || shippingInfo.events.length === 0) && (
            <div className="text-center py-4 text-gray-500">
              <Navigation className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No tracking events available yet</p>
              <p className="text-xs">Check back later for updates</p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
