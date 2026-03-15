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
    <nav className="flex items-center gap-1 text-sm overflow-x-auto pb-1 scrollbar-none rounded-xl bg-bg-secondary/50 border border-border-default/50 px-3 py-2 backdrop-blur-sm transition-all duration-200 hover:border-border-hover">
      <button
        onClick={() => onNavigate(null)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-200 whitespace-nowrap",
          path.length === 0
            ? "text-accent font-medium bg-accent/10"
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
            <ChevronRight className="h-3.5 w-3.5 text-text-muted/50 shrink-0" />
            <button
              onClick={() => onNavigate(folder.id)}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all duration-200 whitespace-nowrap",
                isLast
                  ? "text-accent font-medium bg-accent/10"
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
