"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { User, Mail, Phone, DollarSign, Clock, GripVertical } from "lucide-react";

export interface PipelineLead {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  amount: number;
  assigned_to: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface PipelineCardProps {
  lead: PipelineLead;
  onClick: (lead: PipelineLead) => void;
  isDragging?: boolean;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}j`;
  const diffM = Math.floor(diffD / 30);
  return `${diffM}mois`;
}

export function PipelineCard({ lead, onClick, isDragging }: PipelineCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
        const target = e.currentTarget;
        requestAnimationFrame(() => {
          target.classList.add("opacity-40", "scale-[0.97]");
        });
      }}
      onDragEnd={(e) => {
        e.currentTarget.classList.remove("opacity-40", "scale-[0.97]");
      }}
      onClick={() => onClick(lead)}
      className={cn(
        "group rounded-2xl border border-border-default bg-bg-secondary/60 p-3.5 cursor-grab active:cursor-grabbing",
        "transition-all duration-200",
        "hover:border-accent/20 hover:bg-bg-secondary hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5",
        isDragging && "opacity-40 border-accent scale-[0.97]"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10">
            <User className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">
            {lead.name}
          </span>
        </div>
        <GripVertical className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>

      {/* Info */}
      <div className="space-y-1.5 mb-3">
        {lead.email && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{lead.phone}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {lead.amount > 0 ? (
          <div className="flex items-center gap-1 text-xs font-medium text-accent">
            <DollarSign className="h-3 w-3" />
            {lead.amount.toLocaleString("fr-FR")} &euro;
          </div>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-1 text-[11px] text-text-muted">
          <Clock className="h-3 w-3" />
          {timeAgo(lead.updated_at)}
        </div>
      </div>

      {/* Source badge */}
      {lead.source && (
        <div className="mt-2">
          <span className="inline-block rounded-full bg-bg-tertiary px-2 py-0.5 text-[11px] text-text-muted">
            {lead.source}
          </span>
        </div>
      )}
    </div>
  );
}
