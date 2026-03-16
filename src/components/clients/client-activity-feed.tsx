"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  DollarSign,
  UserPlus,
  Edit,
  Phone,
  Mail,
  FileText,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  deal_created: {
    icon: DollarSign,
    color: "text-accent",
    bgColor: "bg-accent/10",
    label: "Deal",
  },
  deal_updated: {
    icon: Edit,
    color: "text-info",
    bgColor: "bg-info/10",
    label: "Deal modifié",
  },
  deal_closed: {
    icon: DollarSign,
    color: "text-accent",
    bgColor: "bg-accent/10",
    label: "Deal closé",
  },
  note_added: {
    icon: FileText,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/15",
    label: "Note",
  },
  call: {
    icon: Phone,
    color: "text-purple-400",
    bgColor: "bg-purple-500/15",
    label: "Appel",
  },
  email: {
    icon: Mail,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15",
    label: "Email",
  },
  message: {
    icon: MessageSquare,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/15",
    label: "Message",
  },
  status_changed: {
    icon: Edit,
    color: "text-warning",
    bgColor: "bg-warning/10",
    label: "Statut",
  },
  client_created: {
    icon: UserPlus,
    color: "text-accent",
    bgColor: "bg-accent/10",
    label: "Création",
  },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ClientActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
}

export function ClientActivityFeed({
  activities,
  loading,
}: ClientActivityFeedProps) {
  if (loading) {
    return (
      <div className="relative space-y-0">
        <div className="absolute left-[18px] top-3 bottom-3 w-px bg-border-default" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="relative flex items-start gap-4 py-3 pl-1">
            <Skeleton className="relative z-10 h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-default bg-bg-secondary/30 py-14 text-center backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-tertiary mb-4 animate-in zoom-in-50 duration-500">
          <Activity className="h-7 w-7 text-text-muted/50" />
        </div>
        <h3 className="text-base font-semibold text-text-primary mb-1">
          Aucune activité
        </h3>
        <p className="text-sm text-text-secondary max-w-xs">
          Les actions sur ce client apparaîtront ici automatiquement.
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Timeline line */}
      <div className="absolute left-[18px] top-3 bottom-3 w-px bg-border-default" />

      {activities.map((activity, i) => {
        const cfg = TYPE_CONFIG[activity.type] || {
          icon: Activity,
          color: "text-text-muted",
          bgColor: "bg-bg-tertiary",
          label: activity.type,
        };
        const Icon = cfg.icon;

        return (
          <div
            key={activity.id}
            className="relative flex items-start gap-4 py-3 pl-1 rounded-xl transition-all duration-200 hover:bg-bg-secondary/50 hover:px-2 group/item"
          >
            {/* Dot */}
            <div
              className={cn(
                "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-default bg-bg-secondary transition-all",
                i === 0 && "border-accent/40 shadow-sm shadow-accent/10",
              )}
            >
              <Icon className={cn("h-4 w-4", cfg.color)} />
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                    cfg.bgColor,
                    cfg.color,
                  )}
                >
                  {cfg.label}
                </span>
                <span className="text-xs text-text-muted">
                  {formatDate(activity.created_at)}
                </span>
              </div>
              <p className="text-sm text-text-primary mt-1">
                {activity.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
