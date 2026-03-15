"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0);
  return `${size} ${units[i]}`;
}

interface UploadFileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string | null;
  onUploadComplete: () => void;
}

export function UploadFileModal({
  open,
  onOpenChange,
  folderId,
  onUploadComplete,
}: UploadFileModalProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setFiles([]);
      setDragOver(false);
    }
  }, [open]);

  const addFiles = (newFiles: FileList | File[]) => {
    const validFiles: File[] = [];
    Array.from(newFiles).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" dépasse la limite de 50 Mo`);
        return;
      }
      validFiles.push(file);
    });
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    let successCount = 0;
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        if (folderId) formData.append("folder_id", folderId);

        const response = await fetch("/api/drive/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const err = await response.json();
          toast.error(`Erreur pour "${file.name}" : ${err.error}`);
          continue;
        }
        successCount++;
      } catch {
        toast.error(`Erreur lors de l'upload de "${file.name}"`);
      }
    }

    setUploading(false);
    const failedCount = files.length - successCount;
    if (successCount > 0) {
      toast.success(
        successCount === 1
          ? "Fichier uploadé avec succès"
          : `${successCount} fichiers uploadés avec succès`
      );
      onUploadComplete();
      if (failedCount === 0) {
        onOpenChange(false);
      } else {
        // Keep modal open with only the failed files so user can retry
        toast.error(`${failedCount} fichier${failedCount > 1 ? "s" : ""} en erreur`);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-accent" />
            Uploader des fichiers
          </DialogTitle>
          <DialogDescription>
            Glisse tes fichiers ici ou clique pour les sélectionner. Max 50 Mo par fichier.
          </DialogDescription>
        </DialogHeader>

        {/* Drop zone */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-150 cursor-pointer",
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border-default hover:border-border-hover"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-secondary">
            Glisse tes fichiers ici ou{" "}
            <span className="text-accent font-medium">parcourir</span>
          </p>
          <p className="text-xs text-text-muted mt-1">
            PDF, images, vidéos, documents — max 50 Mo
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-bg-tertiary"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-text-muted shrink-0" />
                  <span className="text-sm text-text-primary truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-text-muted shrink-0">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="p-1 rounded text-text-muted hover:text-danger transition-colors shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
          >
            {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {uploading
              ? "Upload en cours..."
              : `Uploader ${files.length > 0 ? `(${files.length})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
