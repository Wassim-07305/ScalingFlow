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
  onPreview?: () => void;
}

export function FileCard({
  name,
  fileUrl,
  fileSize,
  mimeType,
  createdAt,
  onRename,
  onDelete,
  onPreview,
}: FileCardProps) {
  const Icon = getFileIcon(mimeType);
  const iconColor = getFileIconColor(mimeType);

  const handleOpen = () => {
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  const handleClick = () => {
    if (onPreview) {
      onPreview();
    } else {
      handleOpen();
    }
  };

  return (
    <div className="group relative rounded-2xl bg-bg-secondary/50 border border-border-default/50 p-4 transition-all duration-200 hover:border-accent/20 hover:shadow-lg hover:shadow-accent/5 hover:bg-bg-secondary backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <button onClick={handleClick} className="flex-1 text-left" aria-label={`Ouvrir le fichier ${name}`}>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl mb-3 transition-transform duration-200 group-hover:scale-105"
            style={{ backgroundColor: `${iconColor}15` }}
          >
            <Icon className="h-6 w-6" style={{ color: iconColor }} />
          </div>
          <p className="text-sm font-medium text-text-primary truncate" title={name}>
            {name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center rounded-full bg-bg-tertiary/80 px-2 py-0.5 text-[10px] font-medium text-text-muted">
              {formatFileSize(fileSize)}
            </span>
            <span className="text-[10px] text-text-muted">{formatDate(createdAt)}</span>
          </div>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-lg text-text-muted sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 hover:bg-bg-tertiary hover:text-text-primary" aria-label={`Actions pour ${name}`}>
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
