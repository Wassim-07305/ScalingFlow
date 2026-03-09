"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, FileDown, Check } from "lucide-react";
import { exportToPDF } from "@/lib/utils/export-pdf";
import { toast } from "sonner";

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
    exportToPDF({
      title: pdfTitle,
      subtitle: pdfSubtitle,
      content: pdfContent || copyContent,
      filename: pdfFilename,
    });
    toast.success("PDF exporté");
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
          {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copié !" : "Copier"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <FileDown className="h-3.5 w-3.5" />
          PDF
        </Button>
      </div>
    </div>
  );
}
