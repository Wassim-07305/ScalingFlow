"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  { icon: React.ElementType; color: string; label: string }
> = {
  deal_created: { icon: DollarSign, color: "text-accent", label: "Deal" },
  deal_updated: { icon: Edit, color: "text-info", label: "Deal modifié" },
  deal_closed: { icon: DollarSign, color: "text-accent", label: "Deal closé" },
  note_added: { icon: FileText, color: "text-yellow-400", label: "Note" },
  call: { icon: Phone, color: "text-purple-400", label: "Appel" },
  email: { icon: Mail, color: "text-blue-400", label: "Email" },
  message: { icon: MessageSquare, color: "text-cyan-400", label: "Message" },
  status_changed: { icon: Edit, color: "text-warning", label: "Statut" },
  client_created: { icon: UserPlus, color: "text-accent", label: "Création" },
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

export function ClientActivityFeed({ activities, loading }: ClientActivityFeedProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-[12px] bg-bg-tertiary animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12 text-center">
        <Activity className="h-10 w-10 text-text-muted mb-3" />
        <p className="text-sm text-text-secondary">Aucune activité pour le moment.</p>
      </Card>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Timeline line */}
      <div className="absolute left-5 top-3 bottom-3 w-px bg-border-default" />

      {activities.map((activity, i) => {
        const cfg = TYPE_CONFIG[activity.type] || {
          icon: Activity,
          color: "text-text-muted",
          label: activity.type,
        };
        const Icon = cfg.icon;

        return (
          <div key={activity.id} className="relative flex items-start gap-4 py-3 pl-1">
            {/* Dot */}
            <div
              className={cn(
                "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-default bg-bg-secondary",
                i === 0 && "border-accent/40"
              )}
            >
              <Icon className={cn("h-4 w-4", cfg.color)} />
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="muted" className="text-[10px]">
                  {cfg.label}
                </Badge>
                <span className="text-xs text-text-muted">
                  {formatDate(activity.created_at)}
                </span>
              </div>
              <p className="text-sm text-text-primary mt-1">{activity.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
