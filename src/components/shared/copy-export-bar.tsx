"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, FileDown, Check } from "lucide-react";
import { exportToPDF } from "@/lib/utils/export-pdf";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

interface CopyExportBarProps {
  /** Text content to copy to clipboard */
  copyContent: string;
  /** PDF export config */
  pdfTitle: string;
  pdfSubtitle?: string;
  pdfContent?: string | Record<string, unknown>;
  pdfFilename?: string;
  className?: string;
}

export function CopyExportBar({
  copyContent,
  pdfTitle,
  pdfSubtitle,
  pdfContent,
  pdfFilename,
  className,
}: CopyExportBarProps) {
  const [copied, setCopied] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyContent);
      setCopied(true);
      toast.success("Copié dans le presse-papiers");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const handleExport = () => {
    setExporting(true);
    exportToPDF({
      title: pdfTitle,
      subtitle: pdfSubtitle,
      content: pdfContent || copyContent,
      filename: pdfFilename,
    });
    toast.success("PDF exporté");
    setTimeout(() => setExporting(false), 1500);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className={cn(
          "gap-2 transition-all duration-200",
          copied && "border-accent/50 text-accent bg-accent/5",
        )}
        title="Copier dans le presse-papiers"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-accent animate-in zoom-in-50 duration-200" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? "Copié !" : "Copier"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={exporting}
        className={cn(
          "gap-2 transition-all duration-200",
          exporting && "border-accent/50 text-accent bg-accent/5",
        )}
        title="Exporter en PDF"
      >
        <FileDown
          className={cn("h-3.5 w-3.5", exporting && "animate-bounce")}
        />
        PDF
      </Button>
    </div>
  );
}
