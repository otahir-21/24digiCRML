"use client"

import { useState } from "react"
import { Calendar, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const getDateRanges = (): DateRange[] => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);

  const last30Days = new Date(today);
  last30Days.setDate(last30Days.getDate() - 30);

  const last90Days = new Date(today);
  last90Days.setDate(last90Days.getDate() - 90);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const thisYear = new Date(today.getFullYear(), 0, 1);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  return [
    {
      startDate: formatDate(today),
      endDate: formatDate(today),
      label: "Today"
    },
    {
      startDate: formatDate(yesterday),
      endDate: formatDate(yesterday),
      label: "Yesterday"
    },
    {
      startDate: formatDate(last7Days),
      endDate: formatDate(today),
      label: "Last 7 days"
    },
    {
      startDate: formatDate(last30Days),
      endDate: formatDate(today),
      label: "Last 30 days"
    },
    {
      startDate: formatDate(last90Days),
      endDate: formatDate(today),
      label: "Last 90 days"
    },
    {
      startDate: formatDate(thisMonth),
      endDate: formatDate(today),
      label: "This month"
    },
    {
      startDate: formatDate(lastMonth),
      endDate: formatDate(lastMonthEnd),
      label: "Last month"
    },
    {
      startDate: formatDate(thisYear),
      endDate: formatDate(today),
      label: "This year"
    }
  ];
};

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dateRanges = getDateRanges();

  const handleRangeSelect = (range: DateRange) => {
    onChange(range);
    setIsOpen(false);
  };

  return (
    <div className={className}>
      <Label className="text-sm font-medium mb-2 block">Date Range</Label>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{value.label}</span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {dateRanges.map((range) => (
            <DropdownMenuItem
              key={range.label}
              onClick={() => handleRangeSelect(range)}
              className={value.label === range.label ? "bg-accent" : ""}
            >
              {range.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="text-xs text-muted-foreground mt-1">
        {new Date(value.startDate).toLocaleDateString()} - {new Date(value.endDate).toLocaleDateString()}
      </div>
    </div>
  );
}