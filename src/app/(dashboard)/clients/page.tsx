"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientCard, type ClientRow } from "@/components/clients/client-card";
import { ClientForm, type ClientFormData } from "@/components/clients/client-form";
import { SkeletonCard } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import {
  Users,
  UserCheck,
  DollarSign,
  Handshake,
  Plus,
  Search,
  TrendingUp,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type StatusFilter = "all" | ClientRow["status"];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "prospect", label: "Prospects" },
  { value: "actif", label: "Actifs" },
  { value: "inactif", label: "Inactifs" },
  { value: "churne", label: "Churnés" },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ClientsPage() {
  const router = useRouter();
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const [clients, setClients] = React.useState<ClientRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [formOpen, setFormOpen] = React.useState(false);

  // Stats
  const [stats, setStats] = React.useState({
    total: 0,
    actifs: 0,
    caClosé: 0,
    dealsEnCours: 0,
  });

  const fetchClients = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch clients
      const { data: clientsData, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Fetch deals for stats & aggregation
      const { data: dealsData } = await supabase
        .from("client_deals")
        .select("client_id, amount, status")
        .eq("user_id", user.id);

      // Fetch latest activity per client
      const { data: activitiesData } = await supabase
        .from("client_activities")
        .select("client_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Aggregate deals per client
      const dealsByClient: Record<
        string,
        { total: number; count: number }
      > = {};
      let caClosé = 0;
      let dealsEnCours = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (dealsData || []).forEach((d: any) => {
        if (!dealsByClient[d.client_id]) {
          dealsByClient[d.client_id] = { total: 0, count: 0 };
        }
        dealsByClient[d.client_id].total += Number(d.amount);
        dealsByClient[d.client_id].count += 1;

        if (d.status === "close") {
          caClosé += Number(d.amount);
        }
        if (!["close", "perdu"].includes(d.status)) {
          dealsEnCours += 1;
        }
      });

      // Latest activity per client
      const lastActivityByClient: Record<string, string> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (activitiesData || []).forEach((a: any) => {
        if (!lastActivityByClient[a.client_id]) {
          lastActivityByClient[a.client_id] = a.created_at;
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enriched: ClientRow[] = (clientsData || []).map((c: any) => ({
        ...c,
        total_deals_amount: dealsByClient[c.id]?.total ?? 0,
        deals_count: dealsByClient[c.id]?.count ?? 0,
        last_activity: lastActivityByClient[c.id] ?? null,
      }));

      setClients(enriched);
      setStats({
        total: enriched.length,
        actifs: enriched.filter((c) => c.status === "actif").length,
        caClosé,
        dealsEnCours,
      });
    } catch {
      toast.error("Erreur lors du chargement des clients");
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  React.useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleCreate = async (data: ClientFormData) => {
    if (!user) return;
    const { error } = await supabase.from("clients").insert({
      user_id: user.id,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      status: data.status,
      notes: data.notes || null,
    });

    if (error) {
      toast.error("Erreur lors de la création du client");
      return;
    }

    // Log activity
    const { data: newClient } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (newClient) {
      await supabase.from("client_activities").insert({
        client_id: newClient.id,
        user_id: user.id,
        type: "client_created",
        description: `Client "${data.name}" créé`,
      });
    }

    toast.success("Client créé avec succès");
    setFormOpen(false);
    fetchClients();
  };

  // Filter clients
  const filtered = clients.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const STAT_CARDS = [
    {
      label: "Total clients",
      value: stats.total,
      icon: Users,
      color: "text-text-primary",
      bgColor: "bg-bg-tertiary",
    },
    {
      label: "Clients actifs",
      value: stats.actifs,
      icon: UserCheck,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "CA closé",
      value: formatCurrency(stats.caClosé),
      icon: DollarSign,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Deals en cours",
      value: stats.dealsEnCours,
      icon: Handshake,
      color: "text-info",
      bgColor: "bg-info/10",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero header */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-border-default bg-gradient-to-br from-accent/5 via-bg-secondary to-bg-secondary p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Gestion des clients
              </h1>
              <p className="text-sm text-text-secondary">
                Suivez vos prospects, clients et deals au même endroit.
              </p>
            </div>
          </div>
          <Button onClick={() => setFormOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4 mr-1" />
            Ajouter un client
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {STAT_CARDS.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-2xl border border-border-default bg-bg-secondary/50 px-4 py-3 backdrop-blur-sm transition-all duration-300 hover:border-accent/20 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5 hover:bg-bg-secondary"
          >
            <div className={cn("rounded-xl p-2.5", stat.bgColor)}>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">{stat.value}</p>
              <p className="text-[11px] text-text-muted">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clients list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-default bg-bg-secondary/30 py-16 text-center backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-300">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-tertiary mb-4 animate-in zoom-in-50 duration-500">
            <UserX className="h-7 w-7 text-text-muted" />
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">
            {clients.length === 0
              ? "Aucun client pour le moment"
              : "Aucun résultat"}
          </h3>
          <p className="text-sm text-text-secondary mb-5 max-w-sm">
            {clients.length === 0
              ? "Ajoutez votre premier client pour commencer à suivre vos deals et votre pipeline."
              : "Essayez de modifier vos filtres ou votre recherche."}
          </p>
          {clients.length === 0 && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter un client
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="muted">
              {filtered.length} client{filtered.length > 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((client, index) => (
              <div key={client.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-in fade-in-0 slide-in-from-bottom-3 duration-300 fill-mode-both">
                <ClientCard
                  client={client}
                  onClick={() => router.push(`/clients/${client.id}`)}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create modal */}
      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        mode="create"
      />
    </div>
  );
}
