"use client";

import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File,
  FileSpreadsheet,
  MoreVertical,
  Pencil,
  Trash2,
  Download,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text"))
    return FileText;
  if (mimeType.includes("sheet") || mimeType.includes("csv") || mimeType.includes("excel"))
    return FileSpreadsheet;
  return File;
}

function getFileIconColor(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "#F472B6";
  if (mimeType.startsWith("video/")) return "#818CF8";
  if (mimeType.startsWith("audio/")) return "#FBBF24";
  if (mimeType.includes("pdf")) return "#EF4444";
  if (mimeType.includes("sheet") || mimeType.includes("csv")) return "#34D399";
  if (mimeType.includes("document") || mimeType.includes("text")) return "#60A5FA";
  return "#94A3B8";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0);
  return `${size} ${units[i]}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface FileCardProps {
  id: string;
  name: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  onRename: () => void;
  onDelete: () => void;
}

export function FileCard({
  name,
  fileUrl,
  fileSize,
  mimeType,
  createdAt,
  onRename,
  onDelete,
}: FileCardProps) {
  const Icon = getFileIcon(mimeType);
  const iconColor = getFileIconColor(mimeType);

  const handleOpen = () => {
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="group relative rounded-2xl bg-bg-secondary border border-border-default p-4 transition-all duration-150 hover:border-border-hover hover:shadow-lg hover:shadow-accent/5">
      <div className="flex items-start justify-between">
        <button onClick={handleOpen} className="flex-1 text-left">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl mb-3"
            style={{ backgroundColor: `${iconColor}20` }}
          >
            <Icon className="h-6 w-6" style={{ color: iconColor }} />
          </div>
          <p className="text-sm font-medium text-text-primary truncate" title={name}>
            {name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-text-muted">{formatFileSize(fileSize)}</p>
            <span className="text-xs text-text-muted">&middot;</span>
            <p className="text-xs text-text-muted">{formatDate(createdAt)}</p>
          </div>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-lg text-text-muted opacity-0 group-hover:opacity-100 transition-opacity hover:bg-bg-tertiary hover:text-text-primary">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleOpen}>
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              Ouvrir
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const a = document.createElement("a");
                a.href = fileUrl;
                a.download = name;
                a.click();
              }}
            >
              <Download className="h-3.5 w-3.5 mr-2" />
              Télécharger
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRename}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Renommer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-danger focus:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
