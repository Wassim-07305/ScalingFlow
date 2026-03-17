"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import {
  UserPlus,
  TrendingUp,
  Users,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PipelineColumn, type ColumnConfig } from "./pipeline-column";
import { AddLeadForm } from "./add-lead-form";
import { LeadDetailPanel } from "./lead-detail-panel";
import type { PipelineLead } from "./pipeline-card";

export const STATUSES: ColumnConfig[] = [
  {
    key: "nouveau",
    label: "Nouveau",
    color: "text-gray-400",
    bgColor: "bg-gray-500/15",
  },
  {
    key: "engage",
    label: "Engagé",
    color: "text-blue-400",
    bgColor: "bg-blue-500/15",
  },
  {
    key: "call_booke",
    label: "Call booké",
    color: "text-violet-400",
    bgColor: "bg-violet-500/15",
  },
  {
    key: "no_show",
    label: "No-show",
    color: "text-orange-400",
    bgColor: "bg-orange-500/15",
  },
  {
    key: "follow_up",
    label: "Follow-up (R2)",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/15",
  },
  {
    key: "depot_pose",
    label: "Dépôt posé",
    color: "text-lime-400",
    bgColor: "bg-lime-500/15",
  },
  {
    key: "close",
    label: "Deal closé",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
  },
  {
    key: "perdu",
    label: "Perdu",
    color: "text-red-400",
    bgColor: "bg-red-500/15",
  },
];

export function PipelineBoard() {
  const supabase = useMemo(() => createClient(), []);
  const { user } = useUser();
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<PipelineLead | null>(null);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("pipeline_leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erreur lors du chargement des leads");
      return;
    }
    setLeads(data || []);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (user) fetchLeads();
  }, [user, fetchLeads]);

  // Add lead
  const handleAddLead = async (data: {
    name: string;
    email: string;
    phone: string;
    source: string;
    amount: number;
    notes: string;
  }) => {
    if (!user) return;

    const newLead = {
      user_id: user.id,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      source: data.source || null,
      status: "nouveau",
      notes: data.notes || null,
      amount: data.amount,
      assigned_to: null,
      metadata: {},
    };

    const { data: inserted, error } = await supabase
      .from("pipeline_leads")
      .insert(newLead)
      .select()
      .single();

    if (error) {
      toast.error("Erreur lors de l'ajout du lead");
      return;
    }

    // Log activity
    await supabase.from("pipeline_activities").insert({
      lead_id: inserted.id,
      user_id: user.id,
      action: "Lead créé",
      new_status: "nouveau",
    });

    setLeads((prev) => [inserted, ...prev]);
    setShowAddForm(false);
    toast.success("Lead ajouté avec succès");
  };

  // Drop handler — update status
  const handleDrop = async (leadId: string, newStatus: string) => {
    if (!user) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    const oldStatus = lead.status;

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, status: newStatus, updated_at: new Date().toISOString() }
          : l,
      ),
    );

    try {
      const res = await fetch("/api/pipeline/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, newStatus, oldStatus }),
      });

      if (!res.ok) {
        throw new Error("Erreur API");
      }

      const statusLabel =
        STATUSES.find((s) => s.key === newStatus)?.label || newStatus;
      toast.success(`${lead.name} déplacé vers ${statusLabel}`);
    } catch {
      // Rollback
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: oldStatus } : l)),
      );
      toast.error("Erreur lors du changement de statut");
    }
  };

  // Update lead from detail panel
  const handleUpdateLead = (updated: PipelineLead) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setSelectedLead(updated);
  };

  // Delete lead from detail panel
  const handleDeleteLead = (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
  };

  // Stats
  const totalLeads = leads.filter((l) => l.status !== "perdu").length;
  const closedLeads = leads.filter((l) => l.status === "close").length;
  const conversionRate =
    totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

  // No-shows cette semaine
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const noShowsThisWeek = leads.filter(
    (l) =>
      l.status === "no_show" &&
      new Date(l.updated_at) >= weekAgo,
  ).length;

  const closedThisMonth = leads.filter((l) => {
    if (l.status !== "close") return false;
    const d = new Date(l.updated_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border-default bg-bg-secondary/50 p-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Button skeleton */}
        <div className="flex items-center justify-end">
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
        {/* Columns skeleton */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-0 sm:px-0">
          <div className="flex gap-3 min-w-max">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[280px] w-[280px] shrink-0 rounded-2xl border border-border-default bg-bg-primary/50 p-3"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-2.5 w-2.5 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: Math.max(1, 3 - (i % 3)) }).map(
                    (_, j) => (
                      <Skeleton key={j} className="h-24 rounded-2xl" />
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Total leads actifs"
          value={totalLeads.toString()}
          color="text-blue-400"
          bgColor="bg-blue-500/15"
        />
        <StatCard
          icon={TrendingUp}
          label="Taux de conversion"
          value={`${conversionRate}%`}
          color="text-emerald-400"
          bgColor="bg-emerald-500/15"
        />
        <StatCard
          icon={EyeOff}
          label="No-shows cette semaine"
          value={noShowsThisWeek.toString()}
          color="text-orange-400"
          bgColor="bg-orange-500/15"
        />
        <StatCard
          icon={CheckCircle2}
          label="Deals closés ce mois"
          value={closedThisMonth.toString()}
          color="text-accent"
          bgColor="bg-accent/10"
        />
      </div>

      {/* Add button */}
      <div className="flex items-center justify-end">
        <Button onClick={() => setShowAddForm(true)}>
          <UserPlus className="h-4 w-4" />
          Ajouter un lead
        </Button>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-0 sm:px-0 snap-x snap-mandatory md:snap-none">
        <div className="flex gap-3 min-w-max">
          {STATUSES.map((status) => (
            <PipelineColumn
              key={status.key}
              config={status}
              leads={leads.filter((l) => l.status === status.key)}
              onCardClick={setSelectedLead}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>

      {/* Add lead modal */}
      {showAddForm && (
        <AddLeadForm
          onSubmit={handleAddLead}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Lead detail slide-over */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleUpdateLead}
          onDelete={handleDeleteLead}
        />
      )}
    </div>
  );
}

/* ─── Stat card ─── */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border-default bg-bg-secondary/50 px-4 py-3 backdrop-blur-sm transition-all duration-300 hover:border-accent/20 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5 hover:bg-bg-secondary">
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          bgColor,
        )}
      >
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div>
        <p className="text-lg font-bold text-text-primary">{value}</p>
        <p className="text-[11px] text-text-muted">{label}</p>
      </div>
    </div>
  );
}
