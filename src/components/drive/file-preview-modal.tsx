"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileQuestion } from "lucide-react";

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    name: string;
    fileUrl: string;
    mimeType: string;
  } | null;
}

export function FilePreviewModal({
  open,
  onOpenChange,
  file,
}: FilePreviewModalProps) {
  const [textContent, setTextContent] = React.useState<string | null>(null);
  const [textLoading, setTextLoading] = React.useState(false);
  const [textError, setTextError] = React.useState(false);

  // Charger le contenu texte si nécessaire
  React.useEffect(() => {
    if (!file || !open) {
      setTextContent(null);
      setTextError(false);
      return;
    }

    if (!file.mimeType.startsWith("text/")) return;

    let cancelled = false;
    setTextLoading(true);
    setTextError(false);

    fetch(file.fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Fetch failed");
        return res.text();
      })
      .then((text) => {
        if (!cancelled) {
          setTextContent(text);
          setTextLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTextError(true);
          setTextLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [file, open]);

  if (!file) return null;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = file.fileUrl;
    a.download = file.name;
    a.click();
  };

  const handleOpenExternal = () => {
    window.open(file.fileUrl, "_blank", "noopener,noreferrer");
  };

  const renderPreview = () => {
    const { mimeType, fileUrl, name } = file;

    // Images
    if (mimeType.startsWith("image/")) {
      return (
        <div className="flex items-center justify-center max-h-[70vh] overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fileUrl}
            alt={name}
            className="max-w-full max-h-[70vh] rounded-lg object-contain"
          />
        </div>
      );
    }

    // PDFs
    if (mimeType === "application/pdf" || mimeType.includes("pdf")) {
      return (
        <iframe
          src={fileUrl}
          title={name}
          className="h-[70vh] w-full rounded-lg border border-border-default"
        />
      );
    }

    // Texte
    if (mimeType.startsWith("text/")) {
      if (textLoading) {
        return (
          <div className="flex items-center justify-center h-40">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-muted border-t-accent" />
          </div>
        );
      }

      if (textError) {
        return (
          <div className="text-center py-12">
            <p className="text-sm text-text-secondary">
              Impossible de charger le contenu du fichier.
            </p>
          </div>
        );
      }

      return (
        <pre className="max-h-[70vh] overflow-auto rounded-lg bg-bg-tertiary p-4 text-sm text-text-secondary font-mono whitespace-pre-wrap break-words">
          {textContent}
        </pre>
      );
    }

    // Vidéos
    if (mimeType.startsWith("video/")) {
      return (
        <video
          src={fileUrl}
          controls
          className="max-h-[70vh] w-full rounded-lg"
        >
          Ton navigateur ne supporte pas la lecture vidéo.
        </video>
      );
    }

    // Audio
    if (mimeType.startsWith("audio/")) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <audio src={fileUrl} controls className="w-full max-w-md">
            Ton navigateur ne supporte pas la lecture audio.
          </audio>
        </div>
      );
    }

    // Aperçu non disponible
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-tertiary">
          <FileQuestion className="h-8 w-8 text-text-muted" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary mb-1">
            Aperçu non disponible
          </p>
          <p className="text-xs text-text-muted">
            Ce type de fichier ne peut pas être prévisualisé.
          </p>
        </div>
        <Button onClick={handleDownload} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Télécharger
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="truncate">{file.name}</DialogTitle>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenExternal}
                title="Ouvrir dans un nouvel onglet"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                title="Télécharger"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto">{renderPreview()}</div>
      </DialogContent>
    </Dialog>
  );
}
