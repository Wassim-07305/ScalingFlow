"use client";

import { ChevronRight, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface BreadcrumbFolder {
  id: string;
  name: string;
}

interface BreadcrumbNavProps {
  path: BreadcrumbFolder[];
  onNavigate: (folderId: string | null) => void;
}

export function BreadcrumbNav({ path, onNavigate }: BreadcrumbNavProps) {
  return (
    <nav className="flex items-center gap-1 text-sm overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onNavigate(null)}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors whitespace-nowrap",
          path.length === 0
            ? "text-text-primary font-medium"
            : "text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
        )}
      >
        <HardDrive className="h-3.5 w-3.5" />
        Mon Drive
      </button>

      {path.map((folder, i) => {
        const isLast = i === path.length - 1;
        return (
          <div key={folder.id} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-text-muted shrink-0" />
            <button
              onClick={() => onNavigate(folder.id)}
              className={cn(
                "px-2 py-1 rounded-lg transition-colors whitespace-nowrap",
                isLast
                  ? "text-text-primary font-medium"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
              )}
            >
              {folder.name}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
