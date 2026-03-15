"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { PipelineCard, type PipelineLead } from "./pipeline-card";

export interface ColumnConfig {
  key: string;
  label: string;
  color: string;
  bgColor: string;
}

interface PipelineColumnProps {
  config: ColumnConfig;
  leads: PipelineLead[];
  onCardClick: (lead: PipelineLead) => void;
  onDrop: (leadId: string, newStatus: string) => void;
}

export function PipelineColumn({ config, leads, onCardClick, onDrop }: PipelineColumnProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const leadId = e.dataTransfer.getData("text/plain");
    if (leadId) {
      onDrop(leadId, config.key);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col min-w-[280px] w-[280px] shrink-0 rounded-2xl border border-border-default bg-bg-primary/50 transition-all duration-150",
        dragOver && "border-accent bg-accent/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className={cn("h-2.5 w-2.5 rounded-full", config.bgColor)} />
          <span className="text-sm font-semibold text-text-primary">{config.label}</span>
        </div>
        <span className={cn(
          "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-medium",
          config.bgColor, config.color
        )}>
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 p-2 pt-0 overflow-y-auto max-h-[calc(100vh-320px)] min-h-[100px]">
        {leads.length === 0 ? (
          <div className={cn(
            "flex items-center justify-center rounded-xl border border-dashed border-border-default p-6 text-xs text-text-muted transition-colors",
            dragOver && "border-accent text-accent"
          )}>
            {dragOver ? "Relâcher ici" : "Aucun lead"}
          </div>
        ) : (
          leads.map((lead) => (
            <PipelineCard key={lead.id} lead={lead} onClick={onCardClick} />
          ))
        )}
      </div>
    </div>
  );
}
