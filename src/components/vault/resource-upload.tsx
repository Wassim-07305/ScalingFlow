"use client";

import React, { useCallback, useState } from "react";
import { Upload, FileText, Link, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

const ACCEPTED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const ACCEPTED_EXTENSIONS = ".pdf,.txt,.md,.csv,.doc,.docx,.jpg,.jpeg,.png,.webp";

const TYPE_LABELS: Record<string, string> = {
  doc: "Document",
  youtube: "YouTube",
  instagram: "Instagram",
  transcript: "Transcript",
  testimonial: "Temoignage",
  other: "Autre",
};

interface UploadedResource {
  id: string;
  resource_type: string;
  url: string | null;
  file_path: string | null;
  title: string;
  file_size: number | null;
  content_type: string | null;
  has_extracted_text: boolean;
  created_at: string;
}

interface ResourceUploadProps {
  onUploadComplete?: (resource: UploadedResource) => void;
}

export function ResourceUpload({ onUploadComplete }: ResourceUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [urlType, setUrlType] = useState("youtube");

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setUploading(true);

      for (const file of fileArray) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          toast.error(`Type non supporte: ${file.name}`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Fichier trop volumineux: ${file.name} (max 10 MB)`);
          continue;
        }

        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("title", file.name);
          formData.append("resource_type", "doc");

          const res = await fetch("/api/vault/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Erreur upload");
          }

          const data = await res.json();
          toast.success(`${file.name} uploade avec succes`);
          onUploadComplete?.(data.resource);
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : `Erreur pour ${file.name}`
          );
        }
      }

      setUploading(false);
    },
    [onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;

    setUploading(true);
    try {
      const res = await fetch("/api/vault/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: urlInput.trim(),
          title: urlTitle.trim() || urlInput.trim(),
          resource_type: urlType,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur");
      }

      const data = await res.json();
      toast.success("Ressource ajoutee");
      onUploadComplete?.(data.resource);
      setUrlInput("");
      setUrlTitle("");
      setShowUrlForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 transition-all",
          isDragging
            ? "border-emerald-400 bg-emerald-500/10"
            : "border-border-default bg-bg-tertiary hover:border-border-hover"
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm text-text-secondary">Upload en cours...</p>
          </div>
        ) : (
          <>
            <Upload className="mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm font-medium text-text-primary">
              Glisse tes fichiers ici
            </p>
            <p className="mt-1 text-xs text-text-muted">
              PDF, TXT, DOC, images — Max 10 MB
            </p>
            <label className="mt-4 cursor-pointer">
              <span className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80">
                Choisir un fichier
              </span>
              <input
                type="file"
                className="hidden"
                accept={ACCEPTED_EXTENSIONS}
                multiple
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </>
        )}
      </div>

      {/* Add URL toggle */}
      {!showUrlForm ? (
        <button
          onClick={() => setShowUrlForm(true)}
          className="flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          <Link className="h-4 w-4" />
          Ajouter un lien (YouTube, LinkedIn, etc.)
        </button>
      ) : (
        <div className="rounded-xl border border-border-default bg-bg-tertiary p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">
              Ajouter un lien
            </span>
            <button
              onClick={() => setShowUrlForm(false)}
              className="text-text-muted hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-2">
            {(["youtube", "instagram", "testimonial", "other"] as const).map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setUrlType(type)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    urlType === type
                      ? "bg-accent text-white"
                      : "bg-bg-secondary text-text-muted hover:text-text-primary"
                  )}
                >
                  {TYPE_LABELS[type]}
                </button>
              )
            )}
          </div>

          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent"
          />

          <input
            type="text"
            value={urlTitle}
            onChange={(e) => setUrlTitle(e.target.value)}
            placeholder="Titre (optionnel)"
            className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent"
          />

          <Button
            onClick={handleAddUrl}
            disabled={!urlInput.trim() || uploading}
            className="w-full"
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link className="mr-2 h-4 w-4" />
            )}
            Ajouter
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Resource list item ─── */

interface ResourceItemProps {
  resource: UploadedResource;
  onDelete: (id: string) => void;
  deleting?: boolean;
}

export function ResourceItem({ resource, onDelete, deleting }: ResourceItemProps) {
  const isFile = !!resource.file_path;
  const sizeLabel = resource.file_size
    ? resource.file_size > 1024 * 1024
      ? `${(resource.file_size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(resource.file_size / 1024)} KB`
    : null;

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border-default bg-bg-tertiary px-4 py-3 transition-colors hover:border-border-hover">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-secondary">
        {isFile ? (
          <FileText className="h-4 w-4 text-accent" />
        ) : (
          <Link className="h-4 w-4 text-blue-400" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {resource.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>{TYPE_LABELS[resource.resource_type] || resource.resource_type}</span>
          {sizeLabel && <span>· {sizeLabel}</span>}
          {resource.has_extracted_text && (
            <span className="flex items-center gap-0.5 text-emerald-400">
              <CheckCircle className="h-3 w-3" />
              Indexe
            </span>
          )}
          {isFile && !resource.has_extracted_text && (
            <span className="flex items-center gap-0.5 text-amber-400">
              <AlertCircle className="h-3 w-3" />
              Non indexe
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onDelete(resource.id)}
        disabled={deleting}
        className="shrink-0 rounded-lg p-1.5 text-text-muted opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
      >
        {deleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <X className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
