"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import {
  Copy,
  Check,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  ExternalLink,
  Loader2,
  UserPlus,
  Link2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AffiliateData {
  id: string;
  affiliate_code: string;
  referral_link: string;
  status: string;
  tier: string;
  total_earned: number;
  total_paid: number;
  total_referrals: number;
  total_conversions: number;
  created_at: string;
  stripe_account_id: string | null;
  affiliate_programs: {
    name: string;
    commission_rate: number;
    commission_type: string;
    recurring_months: number | null;
    min_payout: number;
    payout_frequency: string;
    terms_url: string | null;
  } | null;
}

interface Referral {
  id: string;
  created_at: string;
  status: string;
  referred_user_id: string | null;
  landing_page: string | null;
}

interface Commission {
  id: string;
  created_at: string;
  amount: number;
  commission_rate: number;
  source_amount: number;
  currency: string;
  status: string;
  period_start: string | null;
}

interface Payout {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  processed_at: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  clicked: { label: "Clic", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  signed_up: { label: "Inscrit", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  converted: { label: "Converti", color: "bg-accent/10 text-accent border-accent/20" },
  churned: { label: "Churned", color: "bg-danger/10 text-danger border-danger/20" },
};

const COMMISSION_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  approved: { label: "Approuvée", color: "bg-accent/10 text-accent border-accent/20" },
  paid: { label: "Payée", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  cancelled: { label: "Annulée", color: "bg-danger/10 text-danger border-danger/20" },
};

const PAYOUT_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  processing: { label: "En cours", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  completed: { label: "Envoyé", color: "bg-accent/10 text-accent border-accent/20" },
  failed: { label: "Échoué", color: "bg-danger/10 text-danger border-danger/20" },
};

function formatAmount(amount: number, currency = "eur") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount);
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-accent",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <Card className="bg-bg-secondary/50 border-border-default">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-text-muted mb-1">{label}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
          </div>
          <div className="h-10 w-10 rounded-xl bg-bg-tertiary flex items-center justify-center">
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AffiliatePage() {
  const supabase = createClient();
  const { user } = useUser();
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Requête directe Supabase (évite le roundtrip HTTP vers /api/affiliates/register)
      const { data: affiliateData } = await supabase
        .from("affiliates")
        .select(
          `id, affiliate_code, referral_link, status, tier,
           custom_commission_rate, total_earned, total_paid,
           total_referrals, total_conversions, created_at, stripe_account_id,
           affiliate_programs(name, commission_rate, commission_type,
             recurring_months, min_payout, payout_frequency, terms_url)`,
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (!affiliateData) {
        setAffiliate(null);
        return;
      }
      setAffiliate(affiliateData as AffiliateData);
      const affId = affiliateData.id;

      const [refRes, commRes, payRes] = await Promise.all([
        supabase
          .from("referrals")
          .select("id, created_at, status, referred_user_id, landing_page")
          .eq("affiliate_id", affId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("commissions")
          .select(
            "id, created_at, amount, commission_rate, source_amount, currency, status, period_start",
          )
          .eq("affiliate_id", affId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("payouts")
          .select("id, created_at, amount, currency, method, status, processed_at")
          .eq("affiliate_id", affId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      setReferrals(refRes.data || []);
      setCommissions(commRes.data || []);
      setPayouts(payRes.data || []);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch("/api/affiliates/register", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Erreur lors de l'inscription");
        return;
      }
      toast.success("Bienvenue dans le programme partenaire !");
      await loadData();
    } finally {
      setJoining(false);
    }
  };

  const copyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const pendingAmount = useMemo(
    () =>
      commissions
        .filter((c) => c.status === "pending" || c.status === "approved")
        .reduce((sum, c) => sum + c.amount, 0),
    [commissions],
  );

  const thisMonthReferrals = useMemo(() => {
    const now = new Date();
    return referrals.filter((r) => {
      const d = new Date(r.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [referrals]);

  const conversionRate = useMemo(
    () =>
      referrals.length > 0
        ? Math.round(
            (referrals.filter((r) => r.status === "converted").length / referrals.length) * 100,
          )
        : 0,
    [referrals],
  );

  const filteredReferrals = useMemo(
    () => (statusFilter === "all" ? referrals : referrals.filter((r) => r.status === statusFilter)),
    [referrals, statusFilter],
  );

  const chartData = useMemo(() => {
    const now = new Date();
    const monthlyMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      monthlyMap[key] = 0;
    }
    for (const c of commissions) {
      if (["pending", "approved", "paid"].includes(c.status)) {
        const d = new Date(c.created_at);
        const key = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
        if (key in monthlyMap) monthlyMap[key] += c.amount;
      }
    }
    return Object.entries(monthlyMap).map(([month, amount]) => ({ month, amount }));
  }, [commissions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  // ─── Pas encore affilié ───────────────────────────────────────────────────
  if (!affiliate) {
    return (
      <div>
        <PageHeader
          title="Programme Partenaire"
          description="Gagne des commissions en référant des clients à ScalingFlow."
        />
        <Card className="max-w-xl mx-auto bg-bg-secondary/50 border-border-default">
          <CardContent className="p-8 text-center space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
              <UserPlus className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-2">
                Deviens partenaire
              </h2>
              <p className="text-text-secondary text-sm">
                Rejoins le programme et gagne{" "}
                <strong className="text-accent">20% de commission</strong> sur chaque
                abonnement de tes filleuls, pendant 12 mois.
              </p>
            </div>
            <ul className="text-sm text-text-secondary space-y-2 text-left">
              {[
                "Lien de referral personnalisé",
                "Commissions récurrentes (12 mois)",
                "Tableau de bord en temps réel",
                "Paiements via Stripe Connect",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button onClick={handleJoin} disabled={joining} className="w-full">
              {joining ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {joining ? "Inscription..." : "Rejoindre le programme"}
            </Button>
            <p className="text-xs text-text-muted">Réservé aux membres Pro et Premium.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Dashboard affilié ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Programme Partenaire"
        description={`${affiliate.affiliate_programs?.name ?? "Programme Partenaire"} — ${affiliate.affiliate_programs?.commission_rate ?? 20}% de commission`}
      />

      {/* Lien de referral */}
      <Card className="bg-bg-secondary/50 border-border-default">
        <CardContent className="p-5">
          <p className="text-xs text-text-muted mb-2 flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            Ton lien de referral
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-sm font-mono text-accent bg-bg-tertiary rounded-lg px-3 py-2 truncate">
              {affiliate.referral_link}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyLink(affiliate.referral_link)}
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-accent" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Code :{" "}
            <span className="text-text-secondary font-mono">{affiliate.affiliate_code}</span>
            {" · "}Cookie 90 jours · Last-click wins
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total gagné"
          value={formatAmount(affiliate.total_earned)}
          color="text-accent"
        />
        <StatCard
          icon={Clock}
          label="En attente"
          value={formatAmount(pendingAmount)}
          sub="Commissions non payées"
          color="text-yellow-400"
        />
        <StatCard
          icon={Users}
          label="Referrals ce mois"
          value={String(thisMonthReferrals)}
          sub={`${affiliate.total_referrals} au total`}
          color="text-blue-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Taux de conversion"
          value={`${conversionRate}%`}
          sub={`${affiliate.total_conversions} convertis`}
          color="text-[#A78BFA]"
        />
      </div>

      {/* Graphique */}
      <Card className="bg-bg-secondary/50 border-border-default">
        <CardHeader>
          <CardTitle className="text-base">Commissions — 6 derniers mois</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={24}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}€`}
              />
              <Tooltip
                formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(2)}€`, "Commission"]}
                contentStyle={{
                  background: "#141719",
                  border: "1px solid #1C1F23",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="amount" fill="#34D399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Referrals */}
      <Card className="bg-bg-secondary/50 border-border-default">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Referrals</CardTitle>
          <div className="flex gap-1.5 flex-wrap">
            {["all", "clicked", "signed_up", "converted"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  statusFilter === s
                    ? "bg-accent/10 text-accent border-accent/30"
                    : "text-text-muted border-border-default hover:text-text-secondary"
                }`}
              >
                {s === "all" ? "Tous" : (STATUS_LABELS[s]?.label ?? s)}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredReferrals.length === 0 ? (
            <p className="text-center text-text-muted text-sm py-8">
              Aucun referral pour l&apos;instant.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default">
                    {["Date", "Visiteur", "Statut", "Page"].map((h) => (
                      <th key={h} className="text-left text-text-muted font-normal px-5 py-3 text-xs">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredReferrals.map((r) => {
                    const st = STATUS_LABELS[r.status] ?? { label: r.status, color: "" };
                    return (
                      <tr key={r.id} className="border-b border-border-default/50 hover:bg-bg-tertiary/30">
                        <td className="px-5 py-3 text-text-secondary">
                          {new Date(r.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-5 py-3 text-text-secondary font-mono text-xs">
                          {r.referred_user_id
                            ? `user-${r.referred_user_id.slice(0, 8)}…`
                            : "Anonyme"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${st.color}`}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-text-muted text-xs truncate max-w-[140px]">
                          {r.landing_page ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commissions */}
      <Card className="bg-bg-secondary/50 border-border-default">
        <CardHeader>
          <CardTitle className="text-base">Commissions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {commissions.length === 0 ? (
            <p className="text-center text-text-muted text-sm py-8">
              Aucune commission générée pour l&apos;instant.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default">
                    {["Date", "Montant source", "Taux", "Commission", "Statut"].map((h) => (
                      <th key={h} className="text-left text-text-muted font-normal px-5 py-3 text-xs">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => {
                    const st = COMMISSION_STATUS[c.status] ?? { label: c.status, color: "" };
                    return (
                      <tr key={c.id} className="border-b border-border-default/50 hover:bg-bg-tertiary/30">
                        <td className="px-5 py-3 text-text-secondary">
                          {new Date(c.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-5 py-3 text-text-secondary">
                          {formatAmount(c.source_amount, c.currency)}
                        </td>
                        <td className="px-5 py-3 text-text-secondary">{c.commission_rate}%</td>
                        <td className="px-5 py-3 font-semibold text-accent">
                          {formatAmount(c.amount, c.currency)}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${st.color}`}
                          >
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payouts */}
      <Card className="bg-bg-secondary/50 border-border-default">
        <CardHeader>
          <CardTitle className="text-base">Paiements reçus</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payouts.length === 0 ? (
            <div className="text-center text-text-muted text-sm py-8">
              <p>Aucun paiement effectué pour l&apos;instant.</p>
              {pendingAmount >= (affiliate.affiliate_programs?.min_payout ?? 50) && (
                <p className="mt-1 text-accent">
                  Tu as {formatAmount(pendingAmount)} en attente — un paiement sera déclenché
                  prochainement.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default">
                    {["Date", "Montant", "Méthode", "Statut"].map((h) => (
                      <th key={h} className="text-left text-text-muted font-normal px-5 py-3 text-xs">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => {
                    const st = PAYOUT_STATUS[p.status] ?? { label: p.status, color: "" };
                    return (
                      <tr key={p.id} className="border-b border-border-default/50 hover:bg-bg-tertiary/30">
                        <td className="px-5 py-3 text-text-secondary">
                          {new Date(p.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-5 py-3 font-semibold text-text-primary">
                          {formatAmount(p.amount, p.currency)}
                        </td>
                        <td className="px-5 py-3 text-text-secondary capitalize">
                          {p.method}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${st.color}`}
                          >
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outils de promotion */}
      <Card className="bg-bg-secondary/50 border-border-default">
        <CardHeader>
          <CardTitle className="text-base">Outils de promotion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Liens UTM */}
          <div>
            <p className="text-xs text-text-muted mb-2">Liens avec paramètres UTM</p>
            <div className="space-y-2">
              {[
                {
                  label: "Instagram Bio",
                  params: "?utm_source=instagram&utm_medium=social",
                },
                { label: "Newsletter", params: "?utm_source=email&utm_medium=newsletter" },
                {
                  label: "YouTube Description",
                  params: "?utm_source=youtube&utm_medium=video",
                },
              ].map(({ label, params }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 bg-bg-tertiary/50 rounded-lg px-3 py-2"
                >
                  <span className="text-xs text-text-secondary flex-1 truncate">
                    {label}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => copyLink(`${affiliate.referral_link}${params}`)}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copier
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Textes prêts */}
          <div>
            <p className="text-xs text-text-muted mb-2">Textes prêts à publier</p>
            <div className="space-y-2">
              {[
                {
                  platform: "LinkedIn",
                  text: `🚀 J'utilise ScalingFlow pour scaler mon business avec l'IA. Si tu veux automatiser ta génération d'offres, ads et funnels, essaie-le via mon lien : ${affiliate.referral_link}`,
                },
                {
                  platform: "Twitter / X",
                  text: `ScalingFlow m'a aidé à créer mes offres, mes ads et mes funnels en quelques minutes. Essaie-le 👉 ${affiliate.referral_link}`,
                },
              ].map(({ platform, text }) => (
                <div key={platform} className="bg-bg-tertiary/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-text-secondary">{platform}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      onClick={() => copyLink(text)}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copier
                    </Button>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stripe Connect */}
          {!affiliate.stripe_account_id && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-sm font-medium text-yellow-400 mb-1">
                Configure ton compte de paiement
              </p>
              <p className="text-xs text-text-muted mb-3">
                Pour recevoir tes paiements automatiquement, connecte ton compte Stripe.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const res = await fetch("/api/affiliates/connect", { method: "POST" });
                  const json = await res.json();
                  if (json.url) window.open(json.url, "_blank");
                  else toast.error(json.error ?? "Erreur");
                }}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Connecter Stripe
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
