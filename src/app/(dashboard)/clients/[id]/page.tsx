"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClientForm, type ClientFormData } from "@/components/clients/client-form";
import { DealForm, type DealFormData, type DealStatus } from "@/components/clients/deal-form";
import {
  ClientActivityFeed,
  type ActivityItem,
} from "@/components/clients/client-activity-feed";
import { SkeletonCard, Skeleton } from "@/components/ui/skeleton";
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
  { label: string; variant: "default" | "blue" | "muted" | "red" | "yellow" }
> = {
  prospect: { label: "Prospect", variant: "blue" },
  actif: { label: "Actif", variant: "default" },
  inactif: { label: "Inactif", variant: "muted" },
  churne: { label: "Churné", variant: "red" },
};

const DEAL_STATUS_CONFIG: Record<
  DealStatus,
  { label: string; variant: "default" | "blue" | "muted" | "red" | "yellow" | "purple" }
> = {
  nouveau: { label: "Nouveau", variant: "blue" },
  engage: { label: "Engagé", variant: "purple" },
  call_booke: { label: "Call booké", variant: "blue" },
  no_show: { label: "No-show", variant: "yellow" },
  follow_up: { label: "Follow-up", variant: "yellow" },
  depot_pose: { label: "Dépôt posé", variant: "purple" },
  close: { label: "Closé", variant: "default" },
  perdu: { label: "Perdu", variant: "red" },
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

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { user } = useUser();
  const supabase = createClient();

  const [client, setClient] = React.useState<ClientDetail | null>(null);
  const [deals, setDeals] = React.useState<DealRow[]>([]);
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editFormOpen, setEditFormOpen] = React.useState(false);
  const [dealFormOpen, setDealFormOpen] = React.useState(false);
  const [editingDeal, setEditingDeal] = React.useState<DealRow | null>(null);

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
      <div>
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-32 w-full mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-48" />
        </div>
      </div>
    );
  }

  if (!client) return null;

  const statusCfg = STATUS_CONFIG[client.status];

  return (
    <div>
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push("/clients")}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Retour aux clients
      </Button>

      {/* Client header */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar className="h-16 w-16">
            {client.avatar_url && (
              <AvatarImage src={client.avatar_url} alt={client.name} />
            )}
            <AvatarFallback className="bg-accent-muted text-accent text-lg font-bold">
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-text-primary">
                {client.name}
              </h1>
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
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

          <div className="flex items-center gap-2">
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
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="apercu">
        <TabsList className="mb-6 w-full sm:w-auto">
          <TabsTrigger value="apercu">Aperçu</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="activite">Activité</TabsTrigger>
        </TabsList>

        {/* ─── Aperçu ─── */}
        <TabsContent value="apercu">
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
                        className="text-sm text-text-primary hover:text-accent"
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

            {/* Stats summary */}
            <div className="space-y-4">
              <Card>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-muted">
                    <DollarSign className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">CA total</p>
                    <p className="text-lg font-bold text-text-primary">
                      {formatCurrency(totalDeals)}
                    </p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-muted">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">CA closé</p>
                    <p className="text-lg font-bold text-accent">
                      {formatCurrency(closedAmount)}
                    </p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/12">
                    <TrendingUp className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Deals en cours</p>
                    <p className="text-lg font-bold text-text-primary">
                      {activeDeals.length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── Deals ─── */}
        <TabsContent value="deals">
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
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="h-10 w-10 text-text-muted mb-3" />
              <p className="text-sm text-text-secondary mb-3">
                Aucun deal pour ce client.
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
            </Card>
          ) : (
            <div className="space-y-3">
              {/* iClosed summary */}
              {closedDeals.length > 0 && (
                <Card className="border-accent/20 bg-accent/5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-sm font-semibold text-accent">
                        {closedDeals.length} deal{closedDeals.length > 1 ? "s" : ""} closé{closedDeals.length > 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-text-secondary">
                        Revenu total closé : {formatCurrency(closedAmount)}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {deals.map((deal) => {
                const dealCfg = DEAL_STATUS_CONFIG[deal.status];
                return (
                  <Card key={deal.id} className="group">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-text-primary truncate">
                            {deal.title}
                          </h3>
                          <Badge variant={dealCfg.variant}>
                            {dealCfg.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
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

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
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
                          onClick={() => handleDeleteDeal(deal)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── Activité ─── */}
        <TabsContent value="activite">
          <h2 className="text-base font-semibold text-text-primary mb-4">
            Fil d&apos;activité
          </h2>
          <ClientActivityFeed activities={activities} />
        </TabsContent>
      </Tabs>

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
