"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClientForm, type ClientFormData } from "@/components/clients/client-form";
import { DealForm, type DealFormData, type DealStatus } from "@/components/clients/deal-form";
import {
  ClientActivityFeed,
  type ActivityItem,
} from "@/components/clients/client-activity-feed";
import { Skeleton, SkeletonCard, SkeletonLine, SkeletonCircle } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  FileText,
  Edit,
  Plus,
  DollarSign,
  TrendingUp,
  Calendar,
  Trash2,
  CheckCircle2,
  Eye,
  LayoutList,
  Activity,
  Sparkles,
} from "lucide-react";

interface ClientDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: "prospect" | "actif" | "inactif" | "churne";
  notes: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface DealRow {
  id: string;
  client_id: string;
  title: string;
  amount: number;
  status: DealStatus;
  closed_at: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "blue" | "muted" | "red" | "yellow"; color: string; bgColor: string }
> = {
  prospect: { label: "Prospect", variant: "blue", color: "text-blue-400", bgColor: "bg-blue-500/15" },
  actif: { label: "Actif", variant: "default", color: "text-emerald-400", bgColor: "bg-emerald-500/15" },
  inactif: { label: "Inactif", variant: "muted", color: "text-text-muted", bgColor: "bg-bg-tertiary" },
  churne: { label: "Churné", variant: "red", color: "text-red-400", bgColor: "bg-red-500/15" },
};

const DEAL_STATUS_CONFIG: Record<
  DealStatus,
  { label: string; variant: "default" | "blue" | "muted" | "red" | "yellow" | "purple"; color: string; bgColor: string }
> = {
  nouveau: { label: "Nouveau", variant: "blue", color: "text-blue-400", bgColor: "bg-blue-500/15" },
  engage: { label: "Engagé", variant: "purple", color: "text-violet-400", bgColor: "bg-violet-500/15" },
  call_booke: { label: "Call booké", variant: "blue", color: "text-cyan-400", bgColor: "bg-cyan-500/15" },
  no_show: { label: "No-show", variant: "yellow", color: "text-orange-400", bgColor: "bg-orange-500/15" },
  follow_up: { label: "Follow-up", variant: "yellow", color: "text-yellow-400", bgColor: "bg-yellow-500/15" },
  depot_pose: { label: "Dépôt posé", variant: "purple", color: "text-indigo-400", bgColor: "bg-indigo-500/15" },
  close: { label: "Closé", variant: "default", color: "text-emerald-400", bgColor: "bg-emerald-500/15" },
  perdu: { label: "Perdu", variant: "red", color: "text-red-400", bgColor: "bg-red-500/15" },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Tabs ────────────────────────────────────────────────────
const TABS = [
  { id: "apercu" as const, label: "Aperçu", icon: Eye },
  { id: "deals" as const, label: "Deals", icon: LayoutList },
  { id: "activite" as const, label: "Activité", icon: Activity },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const [client, setClient] = React.useState<ClientDetail | null>(null);
  const [deals, setDeals] = React.useState<DealRow[]>([]);
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editFormOpen, setEditFormOpen] = React.useState(false);
  const [dealFormOpen, setDealFormOpen] = React.useState(false);
  const [editingDeal, setEditingDeal] = React.useState<DealRow | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabId>("apercu");

  const fetchAll = React.useCallback(async () => {
    if (!user || !clientId) return;
    setLoading(true);

    try {
      const [clientRes, dealsRes, activitiesRes] = await Promise.all([
        supabase
          .from("clients")
          .select("*")
          .eq("id", clientId)
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("client_deals")
          .select("*")
          .eq("client_id", clientId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("client_activities")
          .select("*")
          .eq("client_id", clientId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (clientRes.error || !clientRes.data) {
        toast.error("Client introuvable");
        router.push("/clients");
        return;
      }

      setClient(clientRes.data);
      setDeals(dealsRes.data || []);
      setActivities(activitiesRes.data || []);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [user, clientId, supabase, router]);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Edit client
  const handleEditClient = async (data: ClientFormData) => {
    if (!user || !client) return;

    const { error } = await supabase
      .from("clients")
      .update({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        status: data.status,
        notes: data.notes || null,
      })
      .eq("id", client.id)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }

    // Log status change if changed
    if (data.status !== client.status) {
      await supabase.from("client_activities").insert({
        client_id: client.id,
        user_id: user.id,
        type: "status_changed",
        description: `Statut passé de "${STATUS_CONFIG[client.status].label}" à "${STATUS_CONFIG[data.status].label}"`,
      });
    }

    toast.success("Client mis à jour");
    setEditFormOpen(false);
    fetchAll();
  };

  // Create / edit deal
  const handleSubmitDeal = async (data: DealFormData) => {
    if (!user || !client) return;

    if (editingDeal) {
      // Update
      const { error } = await supabase
        .from("client_deals")
        .update({
          title: data.title,
          amount: data.amount,
          status: data.status,
          notes: data.notes || null,
          closed_at: data.status === "close" ? new Date().toISOString() : null,
        })
        .eq("id", editingDeal.id)
        .eq("user_id", user.id);

      if (error) {
        toast.error("Erreur lors de la mise à jour du deal");
        return;
      }

      await supabase.from("client_activities").insert({
        client_id: client.id,
        user_id: user.id,
        type: data.status === "close" ? "deal_closed" : "deal_updated",
        description:
          data.status === "close"
            ? `Deal "${data.title}" closé pour ${formatCurrency(data.amount)}`
            : `Deal "${data.title}" modifié`,
        metadata: { deal_id: editingDeal.id, amount: data.amount, status: data.status },
      });

      toast.success("Deal mis à jour");
    } else {
      // Create
      const { data: newDeal, error } = await supabase
        .from("client_deals")
        .insert({
          client_id: client.id,
          user_id: user.id,
          title: data.title,
          amount: data.amount,
          status: data.status,
          notes: data.notes || null,
          closed_at: data.status === "close" ? new Date().toISOString() : null,
        })
        .select("id")
        .single();

      if (error) {
        toast.error("Erreur lors de la création du deal");
        return;
      }

      await supabase.from("client_activities").insert({
        client_id: client.id,
        user_id: user.id,
        type: "deal_created",
        description: `Nouveau deal "${data.title}" — ${formatCurrency(data.amount)}`,
        metadata: { deal_id: newDeal?.id, amount: data.amount },
      });

      toast.success("Deal créé");
    }

    setDealFormOpen(false);
    setEditingDeal(null);
    fetchAll();
  };

  // Delete deal
  const handleDeleteDeal = async (deal: DealRow) => {
    if (!user || !client) return;
    if (!confirm(`Supprimer le deal "${deal.title}" ?`)) return;

    const { error } = await supabase
      .from("client_deals")
      .delete()
      .eq("id", deal.id)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success("Deal supprimé");
    fetchAll();
  };

  // Delete client
  const handleDeleteClient = async () => {
    if (!user || !client) return;
    if (
      !confirm(
        `Supprimer définitivement le client "${client.name}" et tous ses deals ?`
      )
    )
      return;

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", client.id)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success("Client supprimé");
    router.push("/clients");
  };

  // Computed stats
  const totalDeals = deals.reduce((sum, d) => sum + Number(d.amount), 0);
  const closedDeals = deals.filter((d) => d.status === "close");
  const closedAmount = closedDeals.reduce((sum, d) => sum + Number(d.amount), 0);
  const activeDeals = deals.filter(
    (d) => !["close", "perdu"].includes(d.status)
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Back button skeleton */}
        <Skeleton className="h-8 w-40 mb-4" />
        {/* Hero skeleton */}
        <div className="rounded-2xl border border-border-default bg-bg-secondary/50 p-6 mb-6">
          <div className="flex items-center gap-4">
            <SkeletonCircle className="h-16 w-16" />
            <div className="flex-1 space-y-2">
              <SkeletonLine className="h-6 w-48" />
              <SkeletonLine className="h-4 w-32" />
              <SkeletonLine className="h-3 w-24" />
            </div>
          </div>
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        {/* Tabs skeleton */}
        <Skeleton className="h-12 w-full rounded-xl mb-6" />
        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-48" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 text-text-secondary hover:text-text-primary"
          onClick={() => router.push("/clients")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour aux clients
        </Button>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-default bg-bg-secondary/30 py-16 text-center backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-300">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-tertiary mb-4 animate-in zoom-in-50 duration-500">
            <Activity className="h-7 w-7 text-text-muted" />
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">
            Client introuvable
          </h3>
          <p className="text-sm text-text-secondary mb-5 max-w-sm">
            Ce client n&apos;existe pas ou a été supprimé.
          </p>
          <Button onClick={() => router.push("/clients")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour aux clients
          </Button>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[client.status];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 text-text-secondary hover:text-text-primary"
        onClick={() => router.push("/clients")}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Retour aux clients
      </Button>

      {/* Client profile header — premium gradient */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-border-default bg-gradient-to-br from-accent/5 via-bg-secondary to-bg-secondary p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-accent/20 ring-offset-2 ring-offset-bg-primary">
            {client.avatar_url && (
              <AvatarImage src={client.avatar_url} alt={client.name} />
            )}
            <AvatarFallback className="bg-accent/10 text-accent text-lg font-bold">
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-text-primary">
                {client.name}
              </h1>
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                statusCfg.bgColor, statusCfg.color
              )}>
                <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.color === "text-text-muted" ? "bg-text-muted" : "bg-current", client.status === "actif" && "animate-pulse")} />
                {statusCfg.label}
              </span>
            </div>
            {client.company && (
              <p className="flex items-center gap-1.5 text-sm text-text-secondary mt-1">
                <Building2 className="h-3.5 w-3.5" />
                {client.company}
              </p>
            )}
            <p className="text-xs text-text-muted mt-1">
              Client depuis le {formatDate(client.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditFormOpen(true)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Modifier
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteClient}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      {/* Mini stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-3 rounded-2xl border border-border-default bg-bg-secondary/50 px-4 py-3 backdrop-blur-sm transition-all duration-300 hover:border-accent/20 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5">
          <div className="rounded-xl bg-accent/10 p-2.5">
            <DollarSign className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary">
              {formatCurrency(totalDeals)}
            </p>
            <p className="text-[11px] text-text-muted">CA total</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border-default bg-bg-secondary/50 px-4 py-3 backdrop-blur-sm transition-all duration-300 hover:border-accent/20 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5">
          <div className="rounded-xl bg-accent/10 p-2.5">
            <CheckCircle2 className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-lg font-bold text-accent">
              {formatCurrency(closedAmount)}
            </p>
            <p className="text-[11px] text-text-muted">CA closé</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border-default bg-bg-secondary/50 px-4 py-3 backdrop-blur-sm transition-all duration-300 hover:border-accent/20 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5">
          <div className="rounded-xl bg-info/10 p-2.5">
            <TrendingUp className="h-4 w-4 text-info" />
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary">
              {activeDeals.length}
            </p>
            <p className="text-[11px] text-text-muted">Deals en cours</p>
          </div>
        </div>
      </div>

      {/* Pill-style tab navigation */}
      <div className="flex gap-1 mb-6 rounded-xl bg-bg-secondary/80 border border-border-default p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === tab.id
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Aperçu ─── */}
      {activeTab === "apercu" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informations de contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-tertiary">
                    <Mail className="h-4 w-4 text-text-muted" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Email</p>
                    <a
                      href={`mailto:${client.email}`}
                      className="text-sm text-accent hover:underline"
                    >
                      {client.email}
                    </a>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-tertiary">
                    <Phone className="h-4 w-4 text-text-muted" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Téléphone</p>
                    <a
                      href={`tel:${client.phone}`}
                      className="text-sm text-text-primary hover:text-accent transition-colors"
                    >
                      {client.phone}
                    </a>
                  </div>
                </div>
              )}
              {client.company && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-tertiary">
                    <Building2 className="h-4 w-4 text-text-muted" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Entreprise</p>
                    <p className="text-sm text-text-primary">{client.company}</p>
                  </div>
                </div>
              )}

              {!client.email && !client.phone && !client.company && (
                <p className="text-sm text-text-muted italic">
                  Aucune information de contact renseignée.
                </p>
              )}

              {client.notes && (
                <>
                  <Separator className="my-3" />
                  <div>
                    <p className="flex items-center gap-1.5 text-xs text-text-muted uppercase tracking-wide mb-2">
                      <FileText className="h-3.5 w-3.5" />
                      Notes
                    </p>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                      {client.notes}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick deal summary */}
          <div className="space-y-4">
            {closedDeals.length > 0 && (
              <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-bg-secondary p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold text-accent">Deals closés</span>
                </div>
                <p className="text-2xl font-bold text-accent">
                  {formatCurrency(closedAmount)}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {closedDeals.length} deal{closedDeals.length > 1 ? "s" : ""} closé{closedDeals.length > 1 ? "s" : ""}
                </p>
              </div>
            )}

            <Card>
              <div className="space-y-3">
                <p className="text-xs text-text-muted uppercase tracking-wide">Résumé rapide</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Total deals</span>
                    <span className="text-sm font-medium text-text-primary">{deals.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">En cours</span>
                    <span className="text-sm font-medium text-text-primary">{activeDeals.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Closés</span>
                    <span className="text-sm font-medium text-accent">{closedDeals.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Perdus</span>
                    <span className="text-sm font-medium text-red-400">
                      {deals.filter((d) => d.status === "perdu").length}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ─── Deals ─── */}
      {activeTab === "deals" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">
              Deals ({deals.length})
            </h2>
            <Button
              size="sm"
              onClick={() => {
                setEditingDeal(null);
                setDealFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nouveau deal
            </Button>
          </div>

          {deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-default bg-bg-secondary/30 py-14 text-center backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-tertiary mb-4 animate-in zoom-in-50 duration-500">
                <DollarSign className="h-7 w-7 text-text-muted" />
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-1">
                Aucun deal pour ce client
              </h3>
              <p className="text-sm text-text-secondary mb-4 max-w-sm">
                Créez votre premier deal pour suivre le chiffre d&apos;affaires de ce client.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setEditingDeal(null);
                  setDealFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Créer un deal
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* iClosed summary */}
              {closedDeals.length > 0 && (
                <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/10 via-accent/5 to-bg-secondary p-4">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <div className="relative flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-accent">
                        {closedDeals.length} deal{closedDeals.length > 1 ? "s" : ""} closé{closedDeals.length > 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-text-secondary">
                        Revenu total closé : {formatCurrency(closedAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {deals.map((deal) => {
                const dealCfg = DEAL_STATUS_CONFIG[deal.status];
                return (
                  <div
                    key={deal.id}
                    className="group rounded-2xl border border-border-default bg-bg-secondary/50 p-4 transition-all duration-300 ease-out hover:border-accent/20 hover:bg-bg-secondary hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-text-primary truncate">
                            {deal.title}
                          </h3>
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                            dealCfg.bgColor, dealCfg.color
                          )}>
                            {dealCfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-sm font-medium text-accent">
                            {formatCurrency(Number(deal.amount))}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-text-muted">
                            <Calendar className="h-3 w-3" />
                            {formatDate(deal.created_at)}
                          </span>
                        </div>
                        {deal.notes && (
                          <p className="text-xs text-text-muted mt-1 truncate">
                            {deal.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Modifier le deal ${deal.title}`}
                          onClick={() => {
                            setEditingDeal(deal);
                            setDealFormOpen(true);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-danger hover:text-danger"
                          aria-label={`Supprimer le deal ${deal.title}`}
                          onClick={() => handleDeleteDeal(deal)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Activité ─── */}
      {activeTab === "activite" && (
        <div>
          <h2 className="text-base font-semibold text-text-primary mb-4">
            Fil d&apos;activité
          </h2>
          <ClientActivityFeed activities={activities} />
        </div>
      )}

      {/* Edit client modal */}
      <ClientForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        onSubmit={handleEditClient}
        initialData={{
          name: client.name,
          email: client.email ?? "",
          phone: client.phone ?? "",
          company: client.company ?? "",
          status: client.status,
          notes: client.notes ?? "",
        }}
        mode="edit"
      />

      {/* Deal form modal */}
      <DealForm
        open={dealFormOpen}
        onOpenChange={(open) => {
          setDealFormOpen(open);
          if (!open) setEditingDeal(null);
        }}
        onSubmit={handleSubmitDeal}
        initialData={
          editingDeal
            ? {
                title: editingDeal.title,
                amount: Number(editingDeal.amount),
                status: editingDeal.status,
                notes: editingDeal.notes ?? "",
              }
            : undefined
        }
        mode={editingDeal ? "edit" : "create"}
      />
    </div>
  );
}
