"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Image as ImageIcon, Table } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ChartExportProps {
  chartTitle: string;
  data: Record<string, unknown>[];
  onExportCSV?: () => Promise<void>;
  onExportPDF?: () => Promise<void>;
  onExportImage?: () => Promise<void>;
  disabled?: boolean;
}

export function ChartExport({
  chartTitle,
  data,
  onExportCSV,
  onExportPDF,
  onExportImage,
  disabled = false,
}: ChartExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (
    type: "csv" | "pdf" | "image",
    handler?: () => Promise<void>
  ) => {
    if (!handler || disabled) return;

    try {
      setIsExporting(true);
      await handler();

      toast({
        title: "Export Successful",
        description: `${chartTitle} exported as ${type.toUpperCase()}`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: `Failed to export ${chartTitle} as ${type.toUpperCase()}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsCSV = () => {
    if (!data.length) return;

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(",")).join("\n");
    const csvContent = `${headers}\n${rows}`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${chartTitle.toLowerCase().replace(/\s+/g, "-")}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting}
          className="h-8 w-8 p-0"
        >
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() =>
            onExportCSV ? handleExport("csv", onExportCSV) : exportAsCSV()
          }
          disabled={isExporting}
        >
          <Table className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>

        {onExportPDF && (
          <DropdownMenuItem
            onClick={() => handleExport("pdf", onExportPDF)}
            disabled={isExporting}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
        )}

        {onExportImage && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleExport("image", onExportImage)}
              disabled={isExporting}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Export as Image
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
