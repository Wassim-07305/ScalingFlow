"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { toast } from "sonner";
import type { PipelineLead } from "./pipeline-card";
import { STATUSES } from "./pipeline-board";

interface Activity {
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

export function LeadDetailPanel({ lead, onClose, onUpdate, onDelete }: LeadDetailPanelProps) {
  const supabase = createClient();
  const [activities, setActivities] = useState<Activity[]>([]);
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
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg border-l border-border-default bg-bg-primary overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-default bg-bg-primary/95 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-muted">
              <User className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">{lead.name}</h2>
              {statusConfig && (
                <Badge
                  variant="muted"
                  className={cn("text-[11px] mt-0.5", statusConfig.bgColor, statusConfig.color)}
                >
                  {statusConfig.label}
                </Badge>
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

        <div className="p-6 space-y-6">
          {/* Contact info */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Informations de contact
            </h3>
            <div className="space-y-2">
              {lead.email && (
                <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <Mail className="h-4 w-4 text-text-muted shrink-0" />
                  <a href={`mailto:${lead.email}`} className="hover:text-accent transition-colors">
                    {lead.email}
                  </a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <Phone className="h-4 w-4 text-text-muted shrink-0" />
                  <a href={`tel:${lead.phone}`} className="hover:text-accent transition-colors">
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.source && (
                <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <Tag className="h-4 w-4 text-text-muted shrink-0" />
                  {lead.source}
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                <Calendar className="h-4 w-4 text-text-muted shrink-0" />
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
                "w-full rounded-xl border border-border-default bg-bg-tertiary px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
                "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
              className="w-full rounded-xl border border-border-default bg-bg-tertiary px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
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
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">
                Aucune activité enregistrée
              </p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex gap-3 rounded-xl border border-border-default bg-bg-secondary/40 p-3"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-tertiary">
                      {activity.old_status && activity.new_status ? (
                        <ArrowRight className="h-3 w-3 text-accent" />
                      ) : (
                        <Clock className="h-3 w-3 text-text-muted" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary">{activity.action}</p>
                      {activity.old_status && activity.new_status && (
                        <p className="text-xs text-text-muted mt-0.5">
                          {getStatusLabel(activity.old_status)} &rarr; {getStatusLabel(activity.new_status)}
                        </p>
                      )}
                      {activity.notes && (
                        <p className="text-xs text-text-muted mt-1">{activity.notes}</p>
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
