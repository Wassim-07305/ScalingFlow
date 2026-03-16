"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  User,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  Clock,
  ArrowRight,
  Loader2,
  Save,
  Trash2,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import type { PipelineLead } from "./pipeline-card";
import { STATUSES } from "./pipeline-board";

interface PipelineActivity {
  id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  notes: string | null;
  created_at: string;
}

interface LeadDetailPanelProps {
  lead: PipelineLead;
  onClose: () => void;
  onUpdate: (lead: PipelineLead) => void;
  onDelete: (leadId: string) => void;
}

export function LeadDetailPanel({
  lead,
  onClose,
  onUpdate,
  onDelete,
}: LeadDetailPanelProps) {
  const supabase = createClient();
  const [activities, setActivities] = useState<PipelineActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [notes, setNotes] = useState(lead.notes || "");
  const [amount, setAmount] = useState(String(lead.amount || 0));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const statusConfig = STATUSES.find((s) => s.key === lead.status);

  // Close on Escape key + prevent body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Sync local state when lead changes
  useEffect(() => {
    setNotes(lead.notes || "");
    setAmount(String(lead.amount || 0));
  }, [lead.id, lead.notes, lead.amount]);

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      setLoadingActivities(true);
      const { data } = await supabase
        .from("pipeline_activities")
        .select("id, action, old_status, new_status, notes, created_at")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setActivities(data || []);
      setLoadingActivities(false);
    };
    fetchActivities();
  }, [lead.id, supabase]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("pipeline_leads")
        .update({
          notes: notes.trim() || null,
          amount: parseFloat(amount) || 0,
        })
        .eq("id", lead.id);

      if (error) throw error;

      onUpdate({
        ...lead,
        notes: notes.trim() || null,
        amount: parseFloat(amount) || 0,
      });
      toast.success("Lead mis à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer ce lead ? Cette action est irréversible.")) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("pipeline_leads")
        .delete()
        .eq("id", lead.id);

      if (error) throw error;

      onDelete(lead.id);
      toast.success("Lead supprimé");
      onClose();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return "—";
    return STATUSES.find((s) => s.key === status)?.label || status;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg border-l border-border-default bg-bg-primary overflow-y-auto shadow-2xl shadow-black/30 animate-in slide-in-from-right-full duration-300 ease-out">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border-default bg-gradient-to-r from-accent/5 via-bg-primary to-bg-primary backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <User className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  {lead.name}
                </h2>
                {statusConfig && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium mt-0.5",
                      statusConfig.bgColor,
                      statusConfig.color,
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {statusConfig.label}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact info */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Informations de contact
            </h3>
            <div className="space-y-2.5">
              {lead.email && (
                <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg-tertiary shrink-0">
                    <Mail className="h-3.5 w-3.5 text-text-muted" />
                  </div>
                  <a
                    href={`mailto:${lead.email}`}
                    className="hover:text-accent transition-colors"
                  >
                    {lead.email}
                  </a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg-tertiary shrink-0">
                    <Phone className="h-3.5 w-3.5 text-text-muted" />
                  </div>
                  <a
                    href={`tel:${lead.phone}`}
                    className="hover:text-accent transition-colors"
                  >
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.source && (
                <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg-tertiary shrink-0">
                    <Tag className="h-3.5 w-3.5 text-text-muted" />
                  </div>
                  {lead.source}
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg-tertiary shrink-0">
                  <Calendar className="h-3.5 w-3.5 text-text-muted" />
                </div>
                Créé le {formatDate(lead.created_at)}
              </div>
            </div>
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-text-muted uppercase tracking-wide">
              <DollarSign className="h-3.5 w-3.5" />
              Montant estimé (&euro;)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="1"
              className={cn(
                "w-full rounded-xl border border-border-default bg-bg-tertiary px-3.5 py-2.5 text-sm text-text-primary",
                "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 focus:shadow-sm focus:shadow-accent/10 transition-colors",
                "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              )}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-text-muted uppercase tracking-wide">
              <FileText className="h-3.5 w-3.5" />
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajouter des notes..."
              rows={4}
              className="w-full rounded-xl border border-border-default bg-bg-tertiary px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 focus:shadow-sm focus:shadow-accent/10 resize-none transition-colors"
            />
          </div>

          {/* Save button */}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Sauvegarder
              </>
            )}
          </Button>

          {/* Activity log */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Historique d&apos;activité
            </h3>
            {loadingActivities ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex gap-3 rounded-xl border border-border-default bg-bg-secondary/40 p-3"
                  >
                    <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-default py-8 text-center animate-in fade-in-0 duration-300">
                <Activity className="h-5 w-5 text-text-muted/30 mb-2" />
                <p className="text-sm text-text-muted">
                  Aucune activité enregistrée
                </p>
              </div>
            ) : (
              <div className="relative space-y-0">
                {/* Timeline line */}
                <div className="absolute left-[14px] top-3 bottom-3 w-px bg-border-default" />

                {activities.map((activity, i) => (
                  <div
                    key={activity.id}
                    className="relative flex items-start gap-3 py-2.5 pl-0"
                  >
                    <div
                      className={cn(
                        "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-default bg-bg-secondary",
                        i === 0 && "border-accent/40",
                      )}
                    >
                      {activity.old_status && activity.new_status ? (
                        <ArrowRight className="h-3 w-3 text-accent" />
                      ) : (
                        <Clock className="h-3 w-3 text-text-muted" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-sm text-text-primary">
                        {activity.action}
                      </p>
                      {activity.old_status && activity.new_status && (
                        <p className="text-xs text-text-muted mt-0.5">
                          {getStatusLabel(activity.old_status)} &rarr;{" "}
                          {getStatusLabel(activity.new_status)}
                        </p>
                      )}
                      {activity.notes && (
                        <p className="text-xs text-text-muted mt-1">
                          {activity.notes}
                        </p>
                      )}
                      <p className="text-[11px] text-text-muted mt-1">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          <div className="border-t border-border-default pt-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="w-full"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Supprimer ce lead
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
