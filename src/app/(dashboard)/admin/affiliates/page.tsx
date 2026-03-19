"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Users,
  DollarSign,
  TrendingUp,
  BarChart2,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AffiliateRow {
  id: string;
  affiliate_code: string;
  status: string;
  tier: string;
  total_earned: number;
  total_paid: number;
  total_referrals: number;
  total_conversions: number;
  custom_commission_rate: number | null;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
  affiliate_programs: { commission_rate: number } | null;
}

interface CommissionRow {
  id: string;
  created_at: string;
  amount: number;
  source_amount: number;
  commission_rate: number;
  currency: string;
  status: string;
  payment_id: string | null;
  affiliates: {
    affiliate_code: string;
    profiles: { full_name: string | null } | null;
  } | null;
}

interface ProgramStats {
  totalAffiliates: number;
  totalRevenue: number;
  totalCommissionsPaid: number;
  pendingCommissions: number;
  roi: number;
}

function formatAmount(amount: number, currency = "eur") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount);
}

const TIER_COLORS: Record<string, string> = {
  standard: "text-text-secondary",
  silver: "text-gray-300",
  gold: "text-yellow-400",
  platinum: "text-[#A78BFA]",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-accent/10 text-accent border-accent/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  suspended: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  banned: "bg-danger/10 text-danger border-danger/20",
};

function StatCard({
  icon: Icon,
  label,
  value,
  color = "text-accent",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Card className="bg-bg-secondary/50 border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-text-muted mb-1">{label}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-bg-tertiary flex items-center justify-center">
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminAffiliatesPage() {
  const supabase = createClient();
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [stats, setStats] = useState<ProgramStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [commFilter, setCommFilter] = useState("pending");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [affRes, commRes] = await Promise.all([
        supabase
          .from("affiliates")
          .select(
            `id, affiliate_code, status, tier, total_earned, total_paid,
             total_referrals, total_conversions, custom_commission_rate, created_at,
             profiles!affiliates_user_id_fkey(full_name, email),
             affiliate_programs(commission_rate)`,
          )
          .order("total_earned", { ascending: false })
          .limit(100),
        supabase
          .from("commissions")
          .select(
            `id, created_at, amount, source_amount, commission_rate, currency,
             status, payment_id,
             affiliates(affiliate_code,
               profiles!affiliates_user_id_fkey(full_name))`,
          )
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      const aff = (affRes.data as AffiliateRow[]) || [];
      const comm = (commRes.data as CommissionRow[]) || [];

      setAffiliates(aff);
      setCommissions(comm);

      const totalRevenue = comm
        .filter((c) => c.status !== "cancelled")
        .reduce((s, c) => s + c.source_amount, 0);
      const totalPaid = comm
        .filter((c) => c.status === "paid")
        .reduce((s, c) => s + c.amount, 0);
      const pending = comm
        .filter((c) => c.status === "pending" || c.status === "approved")
        .reduce((s, c) => s + c.amount, 0);

      setStats({
        totalAffiliates: aff.filter((a) => a.status === "active").length,
        totalRevenue,
        totalCommissionsPaid: totalPaid,
        pendingCommissions: pending,
        roi: totalPaid > 0 ? Math.round((totalRevenue / totalPaid) * 10) / 10 : 0,
      });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const updateAffiliateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    const { error } = await supabase
      .from("affiliates")
      .update({ status })
      .eq("id", id);
    if (error) toast.error("Erreur lors de la mise à jour");
    else {
      toast.success("Statut mis à jour");
      await loadData();
    }
    setActionLoading(null);
  };

  const updateAffiliateTier = async (id: string, tier: string) => {
    const { error } = await supabase
      .from("affiliates")
      .update({ tier })
      .eq("id", id);
    if (error) toast.error("Erreur");
    else {
      toast.success("Tier mis à jour");
      await loadData();
    }
  };

  const approveAllPending = async () => {
    const pendingIds = commissions
      .filter((c) => c.status === "pending")
      .map((c) => c.id);
    if (pendingIds.length === 0) {
      toast.info("Aucune commission en attente");
      return;
    }
    setActionLoading("bulk-approve");
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("commissions")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .in("id", pendingIds)
      .lte("created_at", thirtyDaysAgo);

    if (error) toast.error("Erreur lors de l'approbation");
    else {
      toast.success("Commissions approuvées (>30j)");
      await loadData();
    }
    setActionLoading(null);
  };

  const triggerPayout = async (affiliateId: string) => {
    setActionLoading(`payout-${affiliateId}`);
    try {
      const res = await fetch("/api/affiliates/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliate_id: affiliateId }),
      });
      const json = await res.json();
      if (!res.ok) toast.error(json.error || "Erreur");
      else {
        toast.success(`Payout de ${formatAmount(json.amount)} initié`);
        await loadData();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const filteredComm =
    commFilter === "all" ? commissions : commissions.filter((c) => c.status === commFilter);

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
        title="Gestion du Programme Partenaire"
        description="Affiliés, commissions et paiements"
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Affiliés actifs"
            value={String(stats.totalAffiliates)}
            color="text-blue-400"
          />
          <StatCard
            icon={DollarSign}
            label="Revenue via affiliation"
            value={formatAmount(stats.totalRevenue)}
            color="text-accent"
          />
          <StatCard
            icon={TrendingUp}
            label="Commissions versées"
            value={formatAmount(stats.totalCommissionsPaid)}
            color="text-[#A78BFA]"
          />
          <StatCard
            icon={BarChart2}
            label="ROI du programme"
            value={`${stats.roi}x`}
            color="text-yellow-400"
          />
        </div>
      )}

      {/* Gestion des affiliés */}
      <Card className="bg-bg-secondary/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Affiliés</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  {["Affilié", "Code", "Tier", "Referrals", "Conversions", "Gagné", "Statut", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left text-text-muted font-normal px-4 py-3 text-xs"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {affiliates.map((a) => {
                  const sc = STATUS_COLORS[a.status] ?? "";
                  const tc = TIER_COLORS[a.tier] ?? "";
                  const isLoading = actionLoading === a.id;
                  return (
                    <tr key={a.id} className="border-b border-border/30 hover:bg-bg-tertiary/30">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-text-primary text-xs font-medium">
                            {a.profiles?.full_name ?? "—"}
                          </p>
                          <p className="text-text-muted text-xs">{a.profiles?.email ?? "—"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                        {a.affiliate_code}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={a.tier}
                          onChange={(e) => updateAffiliateTier(a.id, e.target.value)}
                          className={`text-xs bg-transparent border-0 outline-none cursor-pointer ${tc}`}
                        >
                          {["standard", "silver", "gold", "platinum"].map((t) => (
                            <option key={t} value={t} className="bg-bg-secondary text-text-primary">
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs text-center">
                        {a.total_referrals}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs text-center">
                        {a.total_conversions}
                      </td>
                      <td className="px-4 py-3 text-accent text-xs font-semibold">
                        {formatAmount(a.total_earned)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${sc}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {a.status === "active" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-orange-400 hover:text-orange-300"
                              disabled={isLoading}
                              onClick={() => updateAffiliateStatus(a.id, "suspended")}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Suspendre
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-accent hover:text-accent/80"
                              disabled={isLoading}
                              onClick={() => updateAffiliateStatus(a.id, "active")}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Activer
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-blue-400 hover:text-blue-300"
                            disabled={actionLoading === `payout-${a.id}`}
                            onClick={() => triggerPayout(a.id)}
                          >
                            {actionLoading === `payout-${a.id}` ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <DollarSign className="h-3.5 w-3.5 mr-1" />
                            )}
                            Payer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {affiliates.length === 0 && (
              <p className="text-center text-text-muted text-sm py-8">
                Aucun affilié inscrit.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gestion des commissions */}
      <Card className="bg-bg-secondary/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Commissions</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {["all", "pending", "approved", "paid"].map((s) => (
                <button
                  key={s}
                  onClick={() => setCommFilter(s)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    commFilter === s
                      ? "bg-accent/10 text-accent border-accent/30"
                      : "text-text-muted border-border/50 hover:text-text-secondary"
                  }`}
                >
                  {s === "all" ? "Toutes" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={actionLoading === "bulk-approve"}
              onClick={approveAllPending}
            >
              {actionLoading === "bulk-approve" ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
              )}
              Approuver (&gt;30j)
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  {["Date", "Affilié", "Montant source", "Taux", "Commission", "Statut"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left text-text-muted font-normal px-4 py-3 text-xs"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredComm.map((c) => {
                  const statusMap: Record<string, string> = {
                    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                    approved: "bg-accent/10 text-accent border-accent/20",
                    paid: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    cancelled: "bg-danger/10 text-danger border-danger/20",
                  };
                  return (
                    <tr key={c.id} className="border-b border-border/30 hover:bg-bg-tertiary/30">
                      <td className="px-4 py-3 text-text-secondary text-xs">
                        {new Date(c.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">
                        {c.affiliates?.profiles?.full_name ?? c.affiliates?.affiliate_code ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">
                        {formatAmount(c.source_amount, c.currency)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">
                        {c.commission_rate}%
                      </td>
                      <td className="px-4 py-3 font-semibold text-accent text-xs">
                        {formatAmount(c.amount, c.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${statusMap[c.status] ?? ""}`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredComm.length === 0 && (
              <p className="text-center text-text-muted text-sm py-8">
                Aucune commission.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
