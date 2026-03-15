"use client";

import { Folder, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface FolderCardProps {
  id: string;
  name: string;
  color: string;
  fileCount: number;
  onClick: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function FolderCard({
  name,
  color,
  fileCount,
  onClick,
  onRename,
  onDelete,
}: FolderCardProps) {
  return (
    <div className="group relative rounded-2xl bg-bg-secondary/50 border border-border-default/50 p-4 transition-all duration-200 hover:border-accent/20 hover:shadow-lg hover:shadow-accent/5 hover:bg-bg-secondary cursor-pointer backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <button onClick={onClick} className="flex-1 text-left">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl mb-3 transition-transform duration-200 group-hover:scale-105"
            style={{ backgroundColor: `${color}15` }}
          >
            <Folder className="h-6 w-6" style={{ color }} />
          </div>
          <p className="text-sm font-medium text-text-primary truncate">{name}</p>
          <p className="text-xs text-text-muted mt-0.5">
            {fileCount} {fileCount <= 1 ? "fichier" : "fichiers"}
          </p>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-lg text-text-muted opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-bg-tertiary hover:text-text-primary">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
