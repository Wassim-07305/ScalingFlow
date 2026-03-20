"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Route,
  Activity,
  ChevronRight,
  Eye,
  Loader2,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { buildJourneySummary } from "@/lib/services/attribution-engine";
import type { TouchpointJourneyItem } from "@/lib/services/attribution-engine";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModelType = "first_touch" | "last_touch" | "linear" | "time_decay";

interface PaymentAttribution {
  id: string;
  amount: number;
  currency: string;
  first_touch_source: string | null;
  first_touch_channel: string | null;
  last_touch_source: string | null;
  last_touch_channel: string | null;
  journey_json: TouchpointJourneyItem[] | null;
  created_at: string;
}

interface ChannelStats {
  channel: string;
  label: string;
  color: string;
  revenue_first: number;
  revenue_last: number;
  revenue_linear: number;
  revenue_time_decay: number;
  touchpoints: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<string, { label: string; color: string }> = {
  meta_ads: { label: "Meta Ads", color: "#3B82F6" },
  google_ads: { label: "Google Ads", color: "#10B981" },
  organic_social: { label: "Réseaux sociaux", color: "#8B5CF6" },
  email: { label: "Email", color: "#F59E0B" },
  organic: { label: "Organique", color: "#34D399" },
  referral: { label: "Référence", color: "#EC4899" },
  direct: { label: "Direct", color: "#6B7280" },
};

const MODEL_LABELS: Record<ModelType, string> = {
  first_touch: "Premier contact",
  last_touch: "Dernier contact",
  linear: "Linéaire",
  time_decay: "Décroissance temporelle",
};

function getChannelConfig(channel: string) {
  return CHANNEL_CONFIG[channel] || { label: channel, color: "#6B7280" };
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(str: string) {
  try {
    return format(new Date(str), "d MMM yyyy", { locale: fr });
  } catch {
    return str;
  }
}

// ─── Attribution computation (client-side, from payment_attributions) ─────────

function computeLinearCredits(
  journey: TouchpointJourneyItem[],
): Map<string, number> {
  const map = new Map<string, number>();
  if (journey.length === 0) return map;
  const share = 1 / journey.length;
  for (const tp of journey) {
    map.set(tp.channel, (map.get(tp.channel) || 0) + share);
  }
  return map;
}

function computeTimeDecayCredits(
  journey: TouchpointJourneyItem[],
): Map<string, number> {
  const map = new Map<string, number>();
  if (journey.length === 0) return map;
  const last = new Date(journey[journey.length - 1].created_at);
  const weights = journey.map((tp) => {
    const days = Math.abs(
      (last.getTime() - new Date(tp.created_at).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return Math.exp((-Math.LN2 * days) / 7);
  });
  const total = weights.reduce((s, w) => s + w, 0);
  journey.forEach((tp, i) => {
    const credit = total > 0 ? weights[i] / total : 1 / journey.length;
    map.set(tp.channel, (map.get(tp.channel) || 0) + credit);
  });
  return map;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RealTouchpointsPanel() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [touchpoints, setTouchpoints] = useState<TouchpointJourneyItem[]>([]);
  const [payments, setPayments] = useState<PaymentAttribution[]>([]);
  const [model, setModel] = useState<ModelType>("linear");
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentAttribution | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    setLoading(true);

    Promise.all([
      supabase
        .from("touchpoints")
        .select(
          "id, event_type, channel, source, medium, campaign, content, landing_page, referrer, meta_ad_id, meta_campaign_id, created_at",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("payment_attributions")
        .select(
          "id, amount, currency, first_touch_source, first_touch_channel, last_touch_source, last_touch_channel, journey_json, created_at",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ])
      .then(([tpRes, paRes]) => {
        setTouchpoints((tpRes.data as TouchpointJourneyItem[]) || []);
        setPayments((paRes.data as PaymentAttribution[]) || []);
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Aggregate channel stats from payments with journey_json
  const channelStats = useMemo((): ChannelStats[] => {
    const statsMap = new Map<string, ChannelStats>();

    const init = (channel: string) => {
      if (!statsMap.has(channel)) {
        const cfg = getChannelConfig(channel);
        statsMap.set(channel, {
          channel,
          label: cfg.label,
          color: cfg.color,
          revenue_first: 0,
          revenue_last: 0,
          revenue_linear: 0,
          revenue_time_decay: 0,
          touchpoints: 0,
        });
      }
      return statsMap.get(channel)!;
    };

    for (const pay of payments) {
      const amount = pay.amount || 0;
      const journey: TouchpointJourneyItem[] = pay.journey_json || [];

      if (journey.length > 0) {
        // First touch
        const firstCh = journey[0].channel;
        init(firstCh).revenue_first += amount;

        // Last touch
        const lastCh = journey[journey.length - 1].channel;
        init(lastCh).revenue_last += amount;

        // Linear
        const linear = computeLinearCredits(journey);
        linear.forEach((credit, ch) => {
          init(ch).revenue_linear += amount * credit;
        });

        // Time decay
        const decay = computeTimeDecayCredits(journey);
        decay.forEach((credit, ch) => {
          init(ch).revenue_time_decay += amount * credit;
        });

        // Count touchpoints
        journey.forEach((tp) => {
          init(tp.channel).touchpoints++;
        });
      } else {
        // Fallback to first/last from columns
        if (pay.first_touch_channel) {
          init(pay.first_touch_channel).revenue_first += amount;
          init(pay.first_touch_channel).revenue_linear += amount;
          init(pay.first_touch_channel).revenue_last += amount;
          init(pay.first_touch_channel).revenue_time_decay += amount;
        }
      }
    }

    return Array.from(statsMap.values()).sort((a, b) => {
      const key =
        model === "first_touch"
          ? "revenue_first"
          : model === "last_touch"
            ? "revenue_last"
            : model === "time_decay"
              ? "revenue_time_decay"
              : "revenue_linear";
      return b[key] - a[key];
    });
  }, [payments, model]);

  const chartData = useMemo(() => {
    const key =
      model === "first_touch"
        ? "revenue_first"
        : model === "last_touch"
          ? "revenue_last"
          : model === "time_decay"
            ? "revenue_time_decay"
            : "revenue_linear";
    return channelStats
      .map((s) => ({
        name: s.label,
        revenu: Math.round(s[key]),
        color: s.color,
      }))
      .filter((d) => d.revenu > 0);
  }, [channelStats, model]);

  const totalRevenue = useMemo(
    () => payments.reduce((s, p) => s + (p.amount || 0), 0),
    [payments],
  );

  const totalTouchpoints = touchpoints.length;

  // Touchpoints by channel (for overview)
  const tpByChannel = useMemo(() => {
    const map = new Map<string, number>();
    for (const tp of touchpoints) {
      map.set(tp.channel, (map.get(tp.channel) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([channel, count]) => ({ channel, count, ...getChannelConfig(channel) }))
      .sort((a, b) => b.count - a.count);
  }, [touchpoints]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-text-secondary">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement des touchpoints…
      </div>
    );
  }

  if (touchpoints.length === 0 && payments.length === 0) {
    return (
      <Card className="border-dashed border-border-default">
        <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
          <div className="p-4 rounded-full bg-bg-tertiary">
            <Activity className="h-8 w-8 text-text-muted" />
          </div>
          <div>
            <p className="font-semibold text-text-primary mb-1">
              Aucun touchpoint enregistré
            </p>
            <p className="text-sm text-text-secondary max-w-md">
              Les touchpoints sont collectés automatiquement depuis tes pages de
              funnel. Intègre le tracker sur tes landing pages pour commencer à
              suivre le parcours de tes visiteurs.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-xs text-text-muted">Revenu suivi</div>
              <div className="text-xl font-bold">{fmtCurrency(totalRevenue)}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#3B82F6]/10">
              <MapPin className="h-5 w-5 text-[#3B82F6]" />
            </div>
            <div>
              <div className="text-xs text-text-muted">Touchpoints</div>
              <div className="text-xl font-bold">{totalTouchpoints}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#8B5CF6]/10">
              <Route className="h-5 w-5 text-[#8B5CF6]" />
            </div>
            <div>
              <div className="text-xs text-text-muted">Canaux actifs</div>
              <div className="text-xl font-bold">{tpByChannel.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#F59E0B]/10">
              <Activity className="h-5 w-5 text-[#F59E0B]" />
            </div>
            <div>
              <div className="text-xs text-text-muted">Conversions suivies</div>
              <div className="text-xl font-bold">{payments.length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Model selector + chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-base">
              Attribution réelle par canal
            </CardTitle>
            <Select
              value={model}
              onValueChange={(v) => setModel(v as ModelType)}
            >
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(MODEL_LABELS) as ModelType[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    {MODEL_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">
              Pas encore de revenu attribué à des touchpoints
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1c1f23"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#8b8f96", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8b8f96", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}€`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#141719",
                    border: "1px solid #2a2d31",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                  formatter={(v: number | undefined) => [fmtCurrency(v ?? 0), "Revenu attribué"]}
                />
                <Bar dataKey="revenu" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Channel breakdown table */}
      {channelStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détail par canal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-muted border-b border-border-default">
                    <th className="pb-3 pr-4 font-medium">Canal</th>
                    <th className="pb-3 px-4 font-medium text-right">
                      Touchpoints
                    </th>
                    <th className="pb-3 px-4 font-medium text-right">
                      Premier contact
                    </th>
                    <th className="pb-3 px-4 font-medium text-right">
                      Dernier contact
                    </th>
                    <th className="pb-3 pl-4 font-medium text-right">
                      Linéaire
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default/50">
                  {channelStats.map((s) => (
                    <tr key={s.channel}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: s.color }}
                          />
                          <span className="text-text-primary">{s.label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-text-secondary">
                        {s.touchpoints}
                      </td>
                      <td className="py-3 px-4 text-right text-text-secondary">
                        {fmtCurrency(s.revenue_first)}
                      </td>
                      <td className="py-3 px-4 text-right text-text-secondary">
                        {fmtCurrency(s.revenue_last)}
                      </td>
                      <td className="py-3 pl-4 text-right text-text-secondary">
                        {fmtCurrency(s.revenue_linear)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Touchpoints by channel overview */}
      {tpByChannel.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Volume de touchpoints par canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tpByChannel.map((ch) => (
                <div key={ch.channel} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-36 shrink-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: ch.color }}
                    />
                    <span className="text-sm text-text-secondary truncate">
                      {ch.label}
                    </span>
                  </div>
                  <div className="flex-1 bg-bg-tertiary rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        background: ch.color,
                        width: `${Math.round((ch.count / totalTouchpoints) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-text-muted w-8 text-right">
                    {ch.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent payments with journey */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Conversions avec parcours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.slice(0, 10).map((pay) => {
                const journey: TouchpointJourneyItem[] =
                  pay.journey_json || [];
                const summary =
                  journey.length > 0
                    ? buildJourneySummary(journey)
                    : pay.first_touch_channel
                      ? `${getChannelConfig(pay.first_touch_channel).label} → Achat`
                      : "Parcours inconnu";

                return (
                  <div
                    key={pay.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-bg-tertiary border border-border-default"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-text-primary">
                          {fmtCurrency(pay.amount)}
                        </span>
                        <span className="text-xs text-text-muted">
                          {fmtDate(pay.created_at)}
                        </span>
                        {journey.length > 0 && (
                          <Badge variant="muted" className="text-xs">
                            {journey.length} touchpoints
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary truncate">
                        {summary}
                      </p>
                    </div>
                    {journey.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPayment(pay)}
                        className="shrink-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Journey detail modal */}
      <Dialog
        open={!!selectedPayment}
        onOpenChange={() => setSelectedPayment(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Parcours de conversion</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-tertiary">
                <TrendingUp className="h-5 w-5 text-accent" />
                <div>
                  <div className="font-semibold text-text-primary">
                    {fmtCurrency(selectedPayment.amount)}
                  </div>
                  <div className="text-xs text-text-muted">
                    {fmtDate(selectedPayment.created_at)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {(selectedPayment.journey_json || []).map((tp, i) => {
                  const cfg = getChannelConfig(tp.channel);
                  const isLast =
                    i ===
                    (selectedPayment.journey_json || []).length - 1;
                  return (
                    <div key={tp.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-3 h-3 rounded-full border-2 mt-1"
                          style={{
                            borderColor: cfg.color,
                            background: isLast ? cfg.color : "transparent",
                          }}
                        />
                        {!isLast && (
                          <div
                            className="w-0.5 flex-1 mt-1"
                            style={{ background: cfg.color + "40" }}
                          />
                        )}
                      </div>
                      <div
                        className={cn(
                          "flex-1 pb-3",
                          !isLast && "border-b border-border-default/30",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-medium"
                            style={{ color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                          <span className="text-xs text-text-muted">
                            {fmtDate(tp.created_at)}
                          </span>
                          {isLast && (
                            <Badge variant="default" className="text-xs">
                              Conversion
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {tp.event_type === "pageview"
                            ? tp.landing_page || tp.source
                            : tp.event_type}
                          {tp.campaign && ` — ${tp.campaign}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-xs text-text-muted">
                <ChevronRight className="h-3.5 w-3.5" />
                {buildJourneySummary(selectedPayment.journey_json || [])}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
