"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import {
  Bug,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Image as ImageIcon,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BugReport {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  page: string | null;
  screenshot_url: string | null;
  status: "new" | "in_progress" | "resolved" | "dismissed";
  admin_notes: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
    subscription_plan: string | null;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Bug; color: string }> = {
  new: { label: "Nouveau", icon: AlertCircle, color: "bg-red-500/10 text-red-400 border-red-500/20" },
  in_progress: { label: "En cours", icon: Clock, color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  resolved: { label: "Résolu", icon: CheckCircle, color: "bg-accent/10 text-accent border-accent/20" },
  dismissed: { label: "Rejeté", icon: XCircle, color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
};

const STATUS_OPTIONS: BugReport["status"][] = ["new", "in_progress", "resolved", "dismissed"];

export default function BugReportsPage() {
  const { user, profile } = useUser();
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const supabase = useMemo(() => createClient(), []);

  const isAdmin = profile?.role === "admin";

  const fetchReports = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("bug_reports")
      .select("*, profiles(full_name, email, subscription_plan)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erreur chargement des tickets");
    } else {
      setReports((data as BugReport[]) || []);
      // Initialize admin notes
      const notes: Record<string, string> = {};
      for (const r of data || []) {
        notes[r.id] = r.admin_notes || "";
      }
      setAdminNotes(notes);
    }
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateStatus = async (id: string, status: BugReport["status"]) => {
    const { error } = await supabase
      .from("bug_reports")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Erreur mise à jour");
    } else {
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast.success(`Ticket marqué "${STATUS_CONFIG[status].label}"`);
    }
  };

  const saveNotes = async (id: string) => {
    const { error } = await supabase
      .from("bug_reports")
      .update({ admin_notes: adminNotes[id] || null })
      .eq("id", id);

    if (error) {
      toast.error("Erreur sauvegarde");
    } else {
      toast.success("Notes sauvegardées");
    }
  };

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  const counts = {
    all: reports.length,
    new: reports.filter((r) => r.status === "new").length,
    in_progress: reports.filter((r) => r.status === "in_progress").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    dismissed: reports.filter((r) => r.status === "dismissed").length,
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted">Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets de bugs"
        description={`${counts.new} nouveau${counts.new > 1 ? "x" : ""} · ${counts.in_progress} en cours · ${reports.length} total`}
      />

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", ...STATUS_OPTIONS] as const).map((s) => {
          const cfg = s === "all" ? null : STATUS_CONFIG[s];
          const count = counts[s as keyof typeof counts];
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5",
                filter === s
                  ? "bg-accent/10 text-accent border-accent/30"
                  : "text-text-muted border-border-default hover:text-text-secondary",
              )}
            >
              {s === "all" ? "Tous" : cfg?.label}
              <span className="text-[10px] opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Reports list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Bug className="h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-muted">Aucun ticket</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => {
            const cfg = STATUS_CONFIG[report.status];
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === report.id;
            const userName = report.profiles?.full_name || "Utilisateur";
            const userEmail = report.profiles?.email || "";
            const plan = report.profiles?.subscription_plan || "free";

            return (
              <Card key={report.id} className="overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-bg-tertiary/30 transition-colors"
                >
                  <StatusIcon className={cn("h-4 w-4 shrink-0", cfg.color.split(" ")[1])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {report.subject}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {userName} · {plan} · {new Date(report.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {report.page && (
                        <span className="ml-2 font-mono opacity-60">{report.page}</span>
                      )}
                    </p>
                  </div>
                  <Badge className={cn("shrink-0 text-[10px]", cfg.color)}>{cfg.label}</Badge>
                  {report.screenshot_url && <ImageIcon className="h-3.5 w-3.5 text-text-muted shrink-0" />}
                  <ChevronDown className={cn("h-4 w-4 text-text-muted transition-transform", isExpanded && "rotate-180")} />
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border-default px-5 py-4 space-y-4">
                    {/* Description */}
                    <div>
                      <p className="text-xs text-text-muted mb-1">Description</p>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">{report.description}</p>
                    </div>

                    {/* User info */}
                    <div className="flex gap-4 text-xs text-text-muted">
                      <span>Email: <span className="text-text-secondary">{userEmail}</span></span>
                      <span>User ID: <span className="font-mono text-text-secondary">{report.user_id?.slice(0, 8)}...</span></span>
                      <span>Plan: <span className="text-text-secondary">{plan}</span></span>
                    </div>

                    {/* Screenshot */}
                    {report.screenshot_url && (
                      <div>
                        <p className="text-xs text-text-muted mb-2">Capture d'écran</p>
                        <a href={report.screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={report.screenshot_url}
                            alt="Screenshot"
                            className="max-w-md rounded-xl border border-border-default hover:border-accent/30 transition-colors"
                          />
                        </a>
                      </div>
                    )}

                    {/* Admin notes */}
                    <div>
                      <p className="text-xs text-text-muted mb-1.5 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> Notes internes
                      </p>
                      <div className="flex gap-2">
                        <textarea
                          value={adminNotes[report.id] || ""}
                          onChange={(e) => setAdminNotes((prev) => ({ ...prev, [report.id]: e.target.value }))}
                          placeholder="Notes pour l'équipe..."
                          rows={2}
                          className="flex-1 rounded-xl bg-bg-tertiary border border-border-default px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 resize-none"
                        />
                        <Button size="sm" variant="outline" onClick={() => saveNotes(report.id)} className="shrink-0 self-end">
                          Sauver
                        </Button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border-default/50">
                      {STATUS_OPTIONS.filter((s) => s !== report.status).map((s) => {
                        const c = STATUS_CONFIG[s];
                        const Icon = c.icon;
                        return (
                          <Button
                            key={s}
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs"
                            onClick={() => updateStatus(report.id, s)}
                          >
                            <Icon className="h-3 w-3" />
                            {c.label}
                          </Button>
                        );
                      })}
                      {report.page && (
                        <a
                          href={report.page}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-xs text-text-muted hover:text-accent flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" /> Ouvrir la page
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
