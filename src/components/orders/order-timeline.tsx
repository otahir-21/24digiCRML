'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  CreditCard,
  CheckCircle,
  Truck,
  XCircle,
  DollarSign,
  Clock,
  User,
  AlertCircle,
} from 'lucide-react';

export interface TimelineEvent {
  id: string;
  event: string;
  description: string;
  timestamp: string;
  performedBy?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

interface OrderTimelineProps {
  events: TimelineEvent[];
  currentStatus: string;
}

export function OrderTimeline({ events, currentStatus }: OrderTimelineProps) {
  const getEventIcon = (event: string) => {
    const eventType = event.toLowerCase();

    if (eventType.includes('placed') || eventType.includes('created')) {
      return <Package className="h-4 w-4" />;
    }
    if (eventType.includes('payment') || eventType.includes('paid')) {
      return <CreditCard className="h-4 w-4" />;
    }
    if (eventType.includes('confirmed') || eventType.includes('approved')) {
      return <CheckCircle className="h-4 w-4" />;
    }
    if (eventType.includes('shipped') || eventType.includes('dispatch')) {
      return <Truck className="h-4 w-4" />;
    }
    if (eventType.includes('delivered') || eventType.includes('completed')) {
      return <CheckCircle className="h-4 w-4" />;
    }
    if (eventType.includes('cancelled') || eventType.includes('failed')) {
      return <XCircle className="h-4 w-4" />;
    }
    if (eventType.includes('refund')) {
      return <DollarSign className="h-4 w-4" />;
    }

    return <Clock className="h-4 w-4" />;
  };

  const getEventColor = (event: string, index: number) => {
    const eventType = event.toLowerCase();

    if (eventType.includes('delivered') || eventType.includes('completed')) {
      return 'bg-green-500';
    }
    if (eventType.includes('shipped') || eventType.includes('dispatch')) {
      return 'bg-blue-500';
    }
    if (eventType.includes('confirmed') || eventType.includes('approved')) {
      return 'bg-indigo-500';
    }
    if (eventType.includes('payment') || eventType.includes('paid')) {
      return 'bg-emerald-500';
    }
    if (eventType.includes('cancelled') || eventType.includes('failed')) {
      return 'bg-red-500';
    }
    if (eventType.includes('refund')) {
      return 'bg-orange-500';
    }
    if (eventType.includes('processing')) {
      return 'bg-purple-500';
    }

    // Default colors based on position
    const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'];
    return colors[index % colors.length] || 'bg-gray-500';
  };

  const isEventCompleted = (event: string) => {
    const eventType = event.toLowerCase();
    const currentStatusLower = currentStatus.toLowerCase();

    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const eventStatusMap: Record<string, string> = {
      'placed': 'pending',
      'created': 'pending',
      'payment': 'pending',
      'confirmed': 'confirmed',
      'approved': 'confirmed',
      'processing': 'processing',
      'shipped': 'shipped',
      'dispatch': 'shipped',
      'delivered': 'delivered',
      'completed': 'delivered',
    };

    const eventStatus = Object.keys(eventStatusMap).find(key => eventType.includes(key));
    if (!eventStatus) return true; // Unknown events are considered completed

    const eventOrder = statusOrder.indexOf(eventStatusMap[eventStatus]);
    const currentOrder = statusOrder.indexOf(currentStatusLower);

    return eventOrder <= currentOrder;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Order Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {events.map((event, index) => {
            const isCompleted = isEventCompleted(event.event);
            const eventColor = getEventColor(event.event, index);
            const { date, time } = formatTimestamp(event.timestamp);

            return (
              <div key={event.id} className="flex items-start space-x-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-200 ${
                      isCompleted ? eventColor : 'bg-gray-300'
                    }`}
                  >
                    {getEventIcon(event.event)}
                  </div>
                  {index < events.length - 1 && (
                    <div
                      className={`w-0.5 h-16 mt-2 transition-all duration-200 ${
                        isCompleted ? 'bg-gray-300' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>

                <div className="flex-1 pb-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                        {event.event}
                      </h4>
                      <p className={`text-sm mt-1 ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                        {event.description}
                      </p>

                      {event.performedBy && (
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <User className="h-3 w-3 mr-1" />
                          {event.performedBy}
                        </div>
                      )}

                      {event.status && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {event.status}
                        </Badge>
                      )}

                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {Object.entries(event.metadata).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <span className="font-medium">{key}:</span>
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        </div>
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

        {events.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No timeline events available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}