"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import {
  Download,
  Plus,
  Trash2,
  ArrowRight,
  TrendingUp,
  Users,
  Route,
  BarChart3,
  Clock,
  Target,
  Zap,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { RealTouchpointsPanel } from "@/components/analytics/real-touchpoints-panel";

// ─── Types ───────────────────────────────────────────────────
type AttributionModel =
  | "firstTouch"
  | "lastTouch"
  | "linear"
  | "timeDecay"
  | "positionBased";

type Channel =
  | "organic"
  | "paid"
  | "dm"
  | "email"
  | "referral"
  | "direct"
  | "sms"
  | "youtube";

interface Touchpoint {
  id: string;
  channel: Channel;
  label: string;
  date: string; // ISO date
  detail?: string; // e.g. "Reel #12", "Meta Ads - Campagne X"
}

interface CustomerJourney {
  id: string;
  clientName: string;
  revenue: number;
  converted: boolean;
  conversionDate?: string;
  touchpoints: Touchpoint[];
}

// ─── Constants ───────────────────────────────────────────────
const CHANNEL_CONFIG: Record<
  Channel,
  { label: string; color: string; icon: string }
> = {
  organic: { label: "Organique", color: "#34D399", icon: "leaf" },
  paid: { label: "Publicité payante", color: "#3B82F6", icon: "megaphone" },
  dm: { label: "DM / Messages", color: "#8B5CF6", icon: "message" },
  email: { label: "Email", color: "#F59E0B", icon: "mail" },
  referral: { label: "Referral", color: "#EC4899", icon: "users" },
  direct: { label: "Direct", color: "#6B7280", icon: "globe" },
  sms: { label: "SMS", color: "#14B8A6", icon: "phone" },
  youtube: { label: "YouTube", color: "#EF4444", icon: "video" },
};

const CHANNELS = Object.keys(CHANNEL_CONFIG) as Channel[];

const MODEL_LABELS: Record<AttributionModel, string> = {
  firstTouch: "Premier contact",
  lastTouch: "Dernier contact",
  linear: "Lin\u00e9aire",
  timeDecay: "D\u00e9croissance temporelle",
  positionBased: "Bas\u00e9 sur la position",
};

const MODEL_DESCRIPTIONS: Record<AttributionModel, string> = {
  firstTouch:
    "100\u00a0% du cr\u00e9dit au premier point de contact. Id\u00e9al pour mesurer l\u2019efficacit\u00e9 de la d\u00e9couverte.",
  lastTouch:
    "100\u00a0% du cr\u00e9dit au dernier point de contact avant conversion. Id\u00e9al pour mesurer le closing.",
  linear:
    "Cr\u00e9dit r\u00e9parti \u00e9galement entre tous les points de contact. Vue \u00e9quilibr\u00e9e du parcours client.",
  timeDecay:
    "Plus de cr\u00e9dit aux points de contact r\u00e9cents. Bon compromis entre premier et dernier contact.",
  positionBased:
    "40\u00a0% au premier contact, 40\u00a0% au dernier, 20\u00a0% r\u00e9partis au milieu. Mod\u00e8le U-shape.",
};

const MODEL_ICONS: Record<AttributionModel, React.ReactNode> = {
  firstTouch: <Target className="h-4 w-4" />,
  lastTouch: <Zap className="h-4 w-4" />,
  linear: <BarChart3 className="h-4 w-4" />,
  timeDecay: <Clock className="h-4 w-4" />,
  positionBased: <Route className="h-4 w-4" />,
};

// ─── localStorage helpers ────────────────────────────────────
const STORAGE_KEY = "scalingflow_attribution_journeys";

function loadJourneys(): CustomerJourney[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveJourneys(journeys: CustomerJourney[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journeys));
}

// ─── Helpers ─────────────────────────────────────────────────
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// ─── Attribution Calculations ─────────────────────────────────
function calculateAttribution(
  journeys: CustomerJourney[],
  model: AttributionModel,
): Map<Channel, number> {
  const credits = new Map<Channel, number>();
  CHANNELS.forEach((ch) => credits.set(ch, 0));

  const convertedJourneys = journeys.filter(
    (j) => j.converted && j.touchpoints.length > 0,
  );

  for (const journey of convertedJourneys) {
    const tps = journey.touchpoints;
    const revenue = journey.revenue;
    const n = tps.length;

    switch (model) {
      case "firstTouch": {
        const ch = tps[0].channel;
        credits.set(ch, (credits.get(ch) || 0) + revenue);
        break;
      }
      case "lastTouch": {
        const ch = tps[n - 1].channel;
        credits.set(ch, (credits.get(ch) || 0) + revenue);
        break;
      }
      case "linear": {
        const share = revenue / n;
        for (const tp of tps) {
          credits.set(tp.channel, (credits.get(tp.channel) || 0) + share);
        }
        break;
      }
      case "timeDecay": {
        // Exponential decay: each touchpoint gets 2x the weight of the previous
        const weights: number[] = [];
        for (let i = 0; i < n; i++) {
          weights.push(Math.pow(2, i));
        }
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        for (let i = 0; i < n; i++) {
          const share = (weights[i] / totalWeight) * revenue;
          credits.set(
            tps[i].channel,
            (credits.get(tps[i].channel) || 0) + share,
          );
        }
        break;
      }
      case "positionBased": {
        // 40% first, 40% last, 20% distributed among middle
        if (n === 1) {
          credits.set(
            tps[0].channel,
            (credits.get(tps[0].channel) || 0) + revenue,
          );
        } else if (n === 2) {
          credits.set(
            tps[0].channel,
            (credits.get(tps[0].channel) || 0) + revenue * 0.5,
          );
          credits.set(
            tps[1].channel,
            (credits.get(tps[1].channel) || 0) + revenue * 0.5,
          );
        } else {
          credits.set(
            tps[0].channel,
            (credits.get(tps[0].channel) || 0) + revenue * 0.4,
          );
          credits.set(
            tps[n - 1].channel,
            (credits.get(tps[n - 1].channel) || 0) + revenue * 0.4,
          );
          const middleShare = (revenue * 0.2) / (n - 2);
          for (let i = 1; i < n - 1; i++) {
            credits.set(
              tps[i].channel,
              (credits.get(tps[i].channel) || 0) + middleShare,
            );
          }
        }
        break;
      }
    }
  }

  return credits;
}

function getConversionPaths(journeys: CustomerJourney[]): {
  path: string;
  channels: Channel[];
  count: number;
  totalRevenue: number;
}[] {
  const pathMap = new Map<
    string,
    { channels: Channel[]; count: number; totalRevenue: number }
  >();

  for (const journey of journeys.filter((j) => j.converted)) {
    const channels = journey.touchpoints.map((tp) => tp.channel);
    // Deduplicate consecutive same channels
    const deduped: Channel[] = [];
    for (const ch of channels) {
      if (deduped.length === 0 || deduped[deduped.length - 1] !== ch) {
        deduped.push(ch);
      }
    }
    const key = deduped.join(" → ");
    const existing = pathMap.get(key);
    if (existing) {
      existing.count++;
      existing.totalRevenue += journey.revenue;
    } else {
      pathMap.set(key, {
        channels: deduped,
        count: 1,
        totalRevenue: journey.revenue,
      });
    }
  }

  return Array.from(pathMap.entries())
    .map(([path, data]) => ({ path, ...data }))
    .sort((a, b) => b.count - a.count || b.totalRevenue - a.totalRevenue);
}

// ─── Formatting helpers ──────────────────────────────────────
function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), "d MMM yyyy", { locale: fr });
  } catch {
    return dateStr;
  }
}

// ─── Main component ──────────────────────────────────────────
export function AttributionModel() {
  const { user } = useUser();
  const [model, setModel] = useState<AttributionModel>("linear");
  const [journeys, setJourneys] = useState<CustomerJourney[]>([]);
  const [isDemo, setIsDemo] = useState(true);
  const [activeTab, setActiveTab] = useState("attribution");
  const [showAddJourney, setShowAddJourney] = useState(false);
  const [showAddTouchpoint, setShowAddTouchpoint] = useState(false);
  const [editingJourneyId, setEditingJourneyId] = useState<string | null>(null);
  const [loadingSupabase, setLoadingSupabase] = useState(false);

  // Form state for new journey
  const [newJourney, setNewJourney] = useState({
    clientName: "",
    revenue: 0,
    converted: true,
    conversionDate: format(new Date(), "yyyy-MM-dd"),
  });

  // Form state for new touchpoint
  const [newTouchpoint, setNewTouchpoint] = useState({
    channel: "organic" as Channel,
    label: "",
    date: format(new Date(), "yyyy-MM-dd"),
    detail: "",
  });

  // ─── Load data ─────────────────────────────────────────────
  useEffect(() => {
    const stored = loadJourneys();
    if (stored.length > 0) {
      setJourneys(stored);
    }
    setIsDemo(false);
  }, []);

  // Try to enrich from Supabase data
  useEffect(() => {
    if (!user || !isDemo) return;
    setLoadingSupabase(true);
    const supabase = createClient();

    Promise.all([
      supabase
        .from("daily_performance_metrics")
        .select("date, revenue, leads, clients")
        .eq("user_id", user.id)
        .order("date", { ascending: true }),
      supabase
        .from("content_pieces")
        .select("id, content_type, title, created_at, views, likes")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("ad_creatives")
        .select(
          "id, creative_type, headline, created_at, impressions, clicks, conversions",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
    ])
      .then(([metricsRes, contentRes, adsRes]) => {
        const metrics = metricsRes.data || [];
        const content = contentRes.data || [];
        const ads = adsRes.data || [];

        // If we have real data, build journeys from it
        if (metrics.length > 0 || content.length > 0 || ads.length > 0) {
          const autoJourneys = buildJourneysFromSupabase(metrics, content, ads);
          if (autoJourneys.length > 0) {
            setJourneys(autoJourneys);
            setIsDemo(false);
            saveJourneys(autoJourneys);
            toast.success(
              "Donn\u00e9es d\u2019attribution charg\u00e9es depuis Supabase",
            );
          }
        }
      })
      .finally(() => setLoadingSupabase(false));
  }, [user, isDemo]);

  // Build approximate journeys from Supabase tables
  function buildJourneysFromSupabase(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metrics: any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ads: any[],
  ): CustomerJourney[] {
    const built: CustomerJourney[] = [];
    let journeyIdx = 0;

    // Group metrics with clients > 0 as conversion events
    const conversionDays = metrics.filter((m) => m.clients > 0);

    for (const day of conversionDays) {
      journeyIdx++;
      const dateStr =
        typeof day.date === "string"
          ? day.date
          : format(new Date(day.date), "yyyy-MM-dd");
      const touchpoints: Touchpoint[] = [];

      // Find content created before this conversion
      const priorContent = content.filter(
        (c) => new Date(c.created_at) <= new Date(dateStr),
      );
      if (priorContent.length > 0) {
        const latest = priorContent[priorContent.length - 1];
        const contentChannel = mapContentTypeToChannel(latest.content_type);
        touchpoints.push({
          id: generateId(),
          channel: contentChannel,
          label: latest.title || "Contenu organique",
          date: format(new Date(latest.created_at), "yyyy-MM-dd"),
          detail: latest.content_type,
        });
      }

      // Find ads running before this conversion
      const priorAds = ads.filter(
        (a) =>
          new Date(a.created_at) <= new Date(dateStr) &&
          (a.impressions > 0 || a.clicks > 0),
      );
      if (priorAds.length > 0) {
        const latest = priorAds[priorAds.length - 1];
        touchpoints.push({
          id: generateId(),
          channel: "paid",
          label: latest.headline || "Publicit\u00e9",
          date: format(new Date(latest.created_at), "yyyy-MM-dd"),
          detail: `${latest.impressions || 0} impressions, ${latest.clicks || 0} clics`,
        });
      }

      // Add a direct/closing touchpoint for the conversion day
      touchpoints.push({
        id: generateId(),
        channel: "direct",
        label: "Conversion",
        date: dateStr,
        detail: `${day.clients} client(s) acquis`,
      });

      // Sort touchpoints by date
      touchpoints.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      built.push({
        id: generateId(),
        clientName: `Client #${journeyIdx}`,
        revenue: Number(day.revenue) || 0,
        converted: true,
        conversionDate: dateStr,
        touchpoints,
      });
    }

    return built;
  }

  function mapContentTypeToChannel(contentType: string): Channel {
    if (contentType?.includes("youtube")) return "youtube";
    if (contentType?.includes("instagram") || contentType?.includes("tiktok"))
      return "organic";
    if (contentType?.includes("linkedin")) return "organic";
    return "organic";
  }

  // ─── Journey CRUD ──────────────────────────────────────────
  const handleAddJourney = useCallback(() => {
    if (!newJourney.clientName.trim()) {
      toast.error("Le nom du client est requis");
      return;
    }
    const journey: CustomerJourney = {
      id: generateId(),
      clientName: newJourney.clientName.trim(),
      revenue: newJourney.revenue,
      converted: newJourney.converted,
      conversionDate: newJourney.conversionDate,
      touchpoints: [],
    };
    const updated = [...(isDemo ? [] : journeys), journey];
    setJourneys(updated);
    saveJourneys(updated);
    setIsDemo(false);
    setShowAddJourney(false);
    setEditingJourneyId(journey.id);
    setNewJourney({
      clientName: "",
      revenue: 0,
      converted: true,
      conversionDate: format(new Date(), "yyyy-MM-dd"),
    });
    toast.success("Parcours client ajout\u00e9");
  }, [newJourney, journeys, isDemo]);

  const handleDeleteJourney = useCallback(
    (journeyId: string) => {
      const updated = journeys.filter((j) => j.id !== journeyId);
      setJourneys(updated);
      saveJourneys(updated);
      setIsDemo(false);
      if (editingJourneyId === journeyId) setEditingJourneyId(null);
      toast.success("Parcours supprim\u00e9");
    },
    [journeys, editingJourneyId],
  );

  const handleAddTouchpoint = useCallback(() => {
    if (!editingJourneyId || !newTouchpoint.label.trim()) {
      toast.error("Le libell\u00e9 du point de contact est requis");
      return;
    }
    const tp: Touchpoint = {
      id: generateId(),
      channel: newTouchpoint.channel,
      label: newTouchpoint.label.trim(),
      date: newTouchpoint.date,
      detail: newTouchpoint.detail.trim() || undefined,
    };
    const updated = journeys.map((j) => {
      if (j.id !== editingJourneyId) return j;
      const tps = [...j.touchpoints, tp].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      return { ...j, touchpoints: tps };
    });
    setJourneys(updated);
    saveJourneys(updated);
    setShowAddTouchpoint(false);
    setNewTouchpoint({
      channel: "organic",
      label: "",
      date: format(new Date(), "yyyy-MM-dd"),
      detail: "",
    });
    toast.success("Point de contact ajout\u00e9");
  }, [editingJourneyId, newTouchpoint, journeys]);

  const handleDeleteTouchpoint = useCallback(
    (journeyId: string, touchpointId: string) => {
      const updated = journeys.map((j) => {
        if (j.id !== journeyId) return j;
        return {
          ...j,
          touchpoints: j.touchpoints.filter((tp) => tp.id !== touchpointId),
        };
      });
      setJourneys(updated);
      saveJourneys(updated);
    },
    [journeys],
  );

  // ─── Computed data ─────────────────────────────────────────
  const activeJourneys = journeys;
  const convertedJourneys = activeJourneys.filter((j) => j.converted);
  const totalRevenue = convertedJourneys.reduce((s, j) => s + j.revenue, 0);
  const avgTouchpoints =
    convertedJourneys.length > 0
      ? Math.round(
          (convertedJourneys.reduce((s, j) => s + j.touchpoints.length, 0) /
            convertedJourneys.length) *
            10,
        ) / 10
      : 0;

  const attributionMap = useMemo(
    () => calculateAttribution(activeJourneys, model),
    [activeJourneys, model],
  );

  const chartData = useMemo(() => {
    if (totalRevenue === 0) return [];
    return CHANNELS.map((ch) => {
      const value = attributionMap.get(ch) || 0;
      return {
        name: CHANNEL_CONFIG[ch].label,
        channel: ch,
        revenu: Math.round(value),
        pourcentage: Math.round((value / totalRevenue) * 1000) / 10,
        color: CHANNEL_CONFIG[ch].color,
      };
    })
      .filter((d) => d.revenu > 0)
      .sort((a, b) => b.revenu - a.revenu);
  }, [attributionMap, totalRevenue]);

  const conversionPaths = useMemo(
    () => getConversionPaths(activeJourneys),
    [activeJourneys],
  );

  // Compare all models for the comparison table
  const allModelsData = useMemo(() => {
    const models: AttributionModel[] = [
      "firstTouch",
      "lastTouch",
      "linear",
      "timeDecay",
      "positionBased",
    ];
    const result: Record<
      Channel,
      Record<AttributionModel, number>
    > = {} as Record<Channel, Record<AttributionModel, number>>;
    CHANNELS.forEach((ch) => {
      result[ch] = {} as Record<AttributionModel, number>;
    });
    for (const m of models) {
      const map = calculateAttribution(activeJourneys, m);
      for (const ch of CHANNELS) {
        const val = map.get(ch) || 0;
        result[ch][m] =
          totalRevenue > 0 ? Math.round((val / totalRevenue) * 1000) / 10 : 0;
      }
    }
    return result;
  }, [activeJourneys, totalRevenue]);

  const activeChannels = CHANNELS.filter((ch) => {
    return Object.values(allModelsData[ch]).some((v) => v > 0);
  });

  // ─── Export ────────────────────────────────────────────────
  const handleExportJSON = () => {
    const exportData = {
      exported_at: new Date().toISOString(),
      model,
      model_label: MODEL_LABELS[model],
      total_revenue: totalRevenue,
      is_demo: isDemo,
      total_conversions: convertedJourneys.length,
      avg_touchpoints: avgTouchpoints,
      channel_attribution: chartData.map((ch) => ({
        channel: ch.name,
        percentage: ch.pourcentage,
        attributed_revenue: ch.revenu,
      })),
      conversion_paths: conversionPaths.map((p) => ({
        path: p.path,
        count: p.count,
        total_revenue: p.totalRevenue,
      })),
      customer_journeys: activeJourneys.map((j) => ({
        client: j.clientName,
        revenue: j.revenue,
        converted: j.converted,
        touchpoints: j.touchpoints.map((tp) => ({
          channel: tp.channel,
          label: tp.label,
          date: tp.date,
          detail: tp.detail,
        })),
      })),
      all_models_comparison: Object.fromEntries(
        activeChannels.map((ch) => [
          CHANNEL_CONFIG[ch].label,
          allModelsData[ch],
        ]),
      ),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attribution-${model}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export JSON t\u00e9l\u00e9charg\u00e9");
  };

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-xs text-text-muted">
                Revenu total attribu\u00e9
              </div>
              <div className="text-xl font-bold text-text-primary">
                {fmtCurrency(totalRevenue)}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#3B82F6]/10">
              <Users className="h-5 w-5 text-[#3B82F6]" />
            </div>
            <div>
              <div className="text-xs text-text-muted">Conversions</div>
              <div className="text-xl font-bold text-text-primary">
                {convertedJourneys.length}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#F59E0B]/10">
              <Route className="h-5 w-5 text-[#F59E0B]" />
            </div>
            <div>
              <div className="text-xs text-text-muted">
                Points de contact moyens
              </div>
              <div className="text-xl font-bold text-text-primary">
                {avgTouchpoints}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#8B5CF6]/10">
              <BarChart3 className="h-5 w-5 text-[#8B5CF6]" />
            </div>
            <div>
              <div className="text-xs text-text-muted">Canaux actifs</div>
              <div className="text-xl font-bold text-text-primary">
                {activeChannels.length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Info banner */}
      <Card className="border-accent/20">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-text-primary mb-1">
                Attribution multi-touch
              </h3>
              <p className="text-xs text-text-secondary">
                Suis le parcours complet de chaque client, de la d\u00e9couverte
                \u00e0 la conversion. Compare 5 mod\u00e8les d&apos;attribution
                pour comprendre la contribution r\u00e9elle de chaque canal.
                {loadingSupabase && " Chargement des donn\u00e9es Supabase..."}
              </p>
            </div>
            <div className="flex flex-col gap-1 items-end">
              {isDemo && (
                <Badge variant="yellow">Donn\u00e9es de d\u00e9mo</Badge>
              )}
              {!isDemo && (
                <Badge variant="default">Donn\u00e9es r\u00e9elles</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="attribution">Attribution par canal</TabsTrigger>
            <TabsTrigger value="journeys">Parcours clients</TabsTrigger>
            <TabsTrigger value="paths">Chemins de conversion</TabsTrigger>
            <TabsTrigger value="compare">Comparaison</TabsTrigger>
            <TabsTrigger value="real">Touchpoints réels</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleExportJSON}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button size="sm" onClick={() => setShowAddJourney(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter un parcours
            </Button>
          </div>
        </div>

        {/* ─── Tab: Attribution par canal ──────────────────────── */}
        <TabsContent value="attribution">
          <div className="space-y-6">
            {/* Model selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-full sm:w-64">
                <Select
                  value={model}
                  onValueChange={(v) => setModel(v as AttributionModel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(MODEL_LABELS) as AttributionModel[]).map(
                      (m) => (
                        <SelectItem key={m} value={m}>
                          <span className="flex items-center gap-2">
                            {MODEL_ICONS[m]}
                            {MODEL_LABELS[m]}
                          </span>
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-text-secondary flex-1">
                {MODEL_DESCRIPTIONS[model]}
              </p>
            </div>

            {/* Attribution chart */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Attribution du revenu \u2014 {MODEL_LABELS[model]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1C1F23"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          stroke="#6B7280"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v: number) =>
                            new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                              maximumFractionDigits: 0,
                              notation: "compact",
                            }).format(v)
                          }
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#6B7280"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          width={140}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#141719",
                            border: "1px solid #2A2D31",
                            borderRadius: "8px",
                            color: "#F9FAFB",
                          }}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          formatter={(value: any, _name: any, props: any) => {
                            const v = typeof value === "number" ? value : 0;
                            return [
                              `${fmtCurrency(v)} (${props?.payload?.pourcentage ?? 0}%)`,
                              "Revenu attribu\u00e9",
                            ];
                          }}
                        />
                        <Bar
                          dataKey="revenu"
                          radius={[0, 6, 6, 0]}
                          barSize={24}
                        >
                          {chartData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-text-muted text-center py-12">
                    Aucune donn\u00e9e d&apos;attribution. Ajoutez des parcours
                    clients pour commencer.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Channel breakdown cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {chartData.map((ch) => (
                <Card key={ch.channel} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: ch.color }}
                    />
                    <span className="text-sm font-medium text-text-primary">
                      {ch.name}
                    </span>
                    <Badge variant="muted" className="ml-auto">
                      {ch.pourcentage}%
                    </Badge>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-text-primary">
                      {fmtCurrency(ch.revenu)}
                    </div>
                    <div className="text-xs text-text-muted">attribu\u00e9</div>
                  </div>
                  <div className="mt-3 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(ch.revenu / Math.max(...chartData.map((c) => c.revenu), 1)) * 100}%`,
                        backgroundColor: ch.color,
                      }}
                    />
                  </div>
                </Card>
              ))}
            </div>

            {/* Donut chart */}
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>R\u00e9partition des canaux</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="h-[250px] w-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            dataKey="pourcentage"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                          >
                            {chartData.map((entry, idx) => (
                              <Cell key={idx} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#141719",
                              border: "1px solid #2A2D31",
                              borderRadius: "8px",
                              color: "#F9FAFB",
                            }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => [`${value}%`, "Part"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      {chartData.map((ch) => (
                        <div
                          key={ch.channel}
                          className="flex items-center gap-2"
                        >
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: ch.color }}
                          />
                          <div>
                            <div className="text-sm font-medium text-text-primary">
                              {ch.name}
                            </div>
                            <div className="text-xs text-text-muted">
                              {ch.pourcentage}% \u2014 {fmtCurrency(ch.revenu)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ─── Tab: Parcours clients ─────────────────────────── */}
        <TabsContent value="journeys">
          <div className="space-y-4">
            {activeJourneys.map((journey) => (
              <Card key={journey.id} className="overflow-hidden">
                <div className="p-4">
                  {/* Journey header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-text-primary">
                        {journey.clientName}
                      </span>
                      <Badge variant={journey.converted ? "default" : "muted"}>
                        {journey.converted
                          ? fmtCurrency(journey.revenue)
                          : "En cours"}
                      </Badge>
                      {journey.converted && journey.conversionDate && (
                        <span className="text-xs text-text-muted">
                          Converti le {fmtDate(journey.conversionDate)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isDemo && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingJourneyId(
                                editingJourneyId === journey.id
                                  ? null
                                  : journey.id,
                              );
                            }}
                          >
                            {editingJourneyId === journey.id
                              ? "Fermer"
                              : "\u00c9diter"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteJourney(journey.id)}
                          >
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Touchpoint timeline */}
                  {journey.touchpoints.length > 0 ? (
                    <div className="relative ml-4">
                      {/* Vertical line */}
                      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border-default" />
                      <div className="space-y-4">
                        {journey.touchpoints.map((tp, tIdx) => {
                          const channelCfg = CHANNEL_CONFIG[tp.channel];
                          const isFirst = tIdx === 0;
                          const isLast =
                            tIdx === journey.touchpoints.length - 1;
                          return (
                            <div
                              key={tp.id}
                              className="relative flex items-start gap-4 pl-6"
                            >
                              {/* Dot */}
                              <div
                                className={cn(
                                  "absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-2 z-10",
                                  isFirst || isLast
                                    ? "border-accent bg-accent/20"
                                    : "border-border-default bg-bg-secondary",
                                )}
                                style={
                                  !isFirst && !isLast
                                    ? {
                                        borderColor: channelCfg.color,
                                        backgroundColor: `${channelCfg.color}20`,
                                      }
                                    : undefined
                                }
                              />
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-md font-medium"
                                    style={{
                                      backgroundColor: `${channelCfg.color}20`,
                                      color: channelCfg.color,
                                    }}
                                  >
                                    {channelCfg.label}
                                  </span>
                                  <span className="text-sm font-medium text-text-primary">
                                    {tp.label}
                                  </span>
                                  {isFirst && (
                                    <Badge
                                      variant="default"
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      Premier contact
                                    </Badge>
                                  )}
                                  {isLast && journey.converted && (
                                    <Badge
                                      variant="default"
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      Dernier contact
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-text-muted">
                                    {fmtDate(tp.date)}
                                  </span>
                                  {tp.detail && (
                                    <>
                                      <span className="text-text-muted">
                                        \u00b7
                                      </span>
                                      <span className="text-xs text-text-secondary">
                                        {tp.detail}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {/* Delete button when editing */}
                              {editingJourneyId === journey.id && !isDemo && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="shrink-0"
                                  onClick={() =>
                                    handleDeleteTouchpoint(journey.id, tp.id)
                                  }
                                >
                                  <Trash2 className="h-3 w-3 text-danger" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted ml-4">
                      Aucun point de contact. Cliquez sur
                      \u00ab\u00a0\u00c9diter\u00a0\u00bb pour en ajouter.
                    </p>
                  )}

                  {/* Add touchpoint button when editing */}
                  {editingJourneyId === journey.id && !isDemo && (
                    <div className="mt-4 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddTouchpoint(true)}
                        className="border border-dashed border-border-default"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter un point de contact
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ─── Tab: Chemins de conversion ─────────────────────── */}
        <TabsContent value="paths">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  Chemins de conversion les plus fr\u00e9quents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conversionPaths.length > 0 ? (
                  <div className="space-y-4">
                    {conversionPaths.map((pathData, idx) => {
                      const maxCount = conversionPaths[0].count;
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            {/* Path visualization */}
                            <div className="flex items-center gap-1 flex-wrap">
                              {pathData.channels.map((ch, chIdx) => {
                                const cfg = CHANNEL_CONFIG[ch];
                                return (
                                  <React.Fragment key={chIdx}>
                                    {chIdx > 0 && (
                                      <ChevronRight className="h-3 w-3 text-text-muted shrink-0" />
                                    )}
                                    <span
                                      className="text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap"
                                      style={{
                                        backgroundColor: `${cfg.color}15`,
                                        color: cfg.color,
                                        border: `1px solid ${cfg.color}30`,
                                      }}
                                    >
                                      {cfg.label}
                                    </span>
                                  </React.Fragment>
                                );
                              })}
                            </div>
                            {/* Stats */}
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-sm font-semibold text-text-primary">
                                {pathData.count} conversion
                                {pathData.count > 1 ? "s" : ""}
                              </span>
                              <Badge variant="default">
                                {fmtCurrency(pathData.totalRevenue)}
                              </Badge>
                            </div>
                          </div>
                          {/* Bar indicator */}
                          <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent transition-all"
                              style={{
                                width: `${(pathData.count / maxCount) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted text-center py-12">
                    Aucun chemin de conversion d\u00e9tect\u00e9.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Channel transition matrix */}
            {conversionPaths.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Flux entre canaux</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChannelFlowViz journeys={convertedJourneys} />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ─── Tab: Comparaison des mod\u00e8les ─────────────────── */}
        <TabsContent value="compare">
          <Card>
            <CardHeader>
              <CardTitle>
                Comparaison des 5 mod\u00e8les d&apos;attribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="text-left text-text-secondary font-medium py-3 px-2">
                        Canal
                      </th>
                      <th className="text-right text-text-secondary font-medium py-3 px-2">
                        1er contact
                      </th>
                      <th className="text-right text-text-secondary font-medium py-3 px-2">
                        Dernier contact
                      </th>
                      <th className="text-right text-text-secondary font-medium py-3 px-2">
                        Lin\u00e9aire
                      </th>
                      <th className="text-right text-text-secondary font-medium py-3 px-2">
                        D\u00e9croissance
                      </th>
                      <th className="text-right text-text-secondary font-medium py-3 px-2">
                        Position
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeChannels.map((ch) => {
                      const cfg = CHANNEL_CONFIG[ch];
                      const data = allModelsData[ch];
                      return (
                        <tr
                          key={ch}
                          className="border-b border-border-default/50 hover:bg-bg-tertiary/50 transition-colors"
                        >
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: cfg.color }}
                              />
                              <span className="font-medium text-text-primary">
                                {cfg.label}
                              </span>
                            </div>
                          </td>
                          {(
                            [
                              "firstTouch",
                              "lastTouch",
                              "linear",
                              "timeDecay",
                              "positionBased",
                            ] as AttributionModel[]
                          ).map((m) => (
                            <td
                              key={m}
                              className={cn(
                                "py-3 px-2 text-right tabular-nums",
                                model === m
                                  ? "font-semibold text-accent"
                                  : "text-text-secondary",
                              )}
                            >
                              {data[m] > 0 ? `${data[m]}%` : "\u2014"}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                    {/* Total row */}
                    <tr className="border-t-2 border-border-default">
                      <td className="py-3 px-2 font-semibold text-text-primary">
                        Total
                      </td>
                      {(
                        [
                          "firstTouch",
                          "lastTouch",
                          "linear",
                          "timeDecay",
                          "positionBased",
                        ] as AttributionModel[]
                      ).map((m) => {
                        const total = activeChannels.reduce(
                          (s, ch) => s + (allModelsData[ch][m] || 0),
                          0,
                        );
                        return (
                          <td
                            key={m}
                            className={cn(
                              "py-3 px-2 text-right tabular-nums font-semibold",
                              model === m ? "text-accent" : "text-text-primary",
                            )}
                          >
                            {Math.round(total * 10) / 10}%
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Multi-model bar chart comparison */}
              {activeChannels.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-sm font-medium text-text-secondary mb-4">
                    Visualisation comparative par canal
                  </h4>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={activeChannels.map((ch) => ({
                          name: CHANNEL_CONFIG[ch].label,
                          "Premier contact": allModelsData[ch].firstTouch,
                          "Dernier contact": allModelsData[ch].lastTouch,
                          "Lin\u00e9aire": allModelsData[ch].linear,
                          "D\u00e9croissance": allModelsData[ch].timeDecay,
                          Position: allModelsData[ch].positionBased,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1C1F23" />
                        <XAxis
                          dataKey="name"
                          stroke="#6B7280"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          angle={-20}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis
                          stroke="#6B7280"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v: number) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#141719",
                            border: "1px solid #2A2D31",
                            borderRadius: "8px",
                            color: "#F9FAFB",
                          }}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          formatter={(value: any) => [`${value}%`]}
                        />
                        <Bar
                          dataKey="Premier contact"
                          fill="#34D399"
                          radius={[2, 2, 0, 0]}
                        />
                        <Bar
                          dataKey="Dernier contact"
                          fill="#3B82F6"
                          radius={[2, 2, 0, 0]}
                        />
                        <Bar
                          dataKey="Lin\u00e9aire"
                          fill="#F59E0B"
                          radius={[2, 2, 0, 0]}
                        />
                        <Bar
                          dataKey="D\u00e9croissance"
                          fill="#8B5CF6"
                          radius={[2, 2, 0, 0]}
                        />
                        <Bar
                          dataKey="Position"
                          fill="#EC4899"
                          radius={[2, 2, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
                    {[
                      { label: "Premier contact", color: "#34D399" },
                      { label: "Dernier contact", color: "#3B82F6" },
                      { label: "Lin\u00e9aire", color: "#F59E0B" },
                      { label: "D\u00e9croissance", color: "#8B5CF6" },
                      { label: "Position", color: "#EC4899" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-1.5"
                      >
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-text-secondary">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab: Touchpoints réels ──────────────────────────── */}
        <TabsContent value="real">
          <RealTouchpointsPanel />
        </TabsContent>
      </Tabs>

      {/* ─── Dialog: Ajouter un parcours ──────────────────────── */}
      <Dialog open={showAddJourney} onOpenChange={setShowAddJourney}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau parcours client</DialogTitle>
            <DialogDescription>
              Cr\u00e9ez un parcours pour suivre les points de contact d&apos;un
              client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom du client</Label>
              <Input
                placeholder="ex. Sophie M."
                value={newJourney.clientName}
                onChange={(e) =>
                  setNewJourney((p) => ({ ...p, clientName: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Revenu g\u00e9n\u00e9r\u00e9 (\u20ac)</Label>
              <Input
                type="number"
                placeholder="0"
                value={newJourney.revenue || ""}
                onChange={(e) =>
                  setNewJourney((p) => ({
                    ...p,
                    revenue: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <Label>Converti</Label>
              <Select
                value={newJourney.converted ? "oui" : "non"}
                onValueChange={(v) =>
                  setNewJourney((p) => ({ ...p, converted: v === "oui" }))
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oui">Oui</SelectItem>
                  <SelectItem value="non">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newJourney.converted && (
              <div>
                <Label>Date de conversion</Label>
                <Input
                  type="date"
                  value={newJourney.conversionDate}
                  onChange={(e) =>
                    setNewJourney((p) => ({
                      ...p,
                      conversionDate: e.target.value,
                    }))
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddJourney(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddJourney}>Cr\u00e9er le parcours</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Dialog: Ajouter un point de contact ──────────────── */}
      <Dialog open={showAddTouchpoint} onOpenChange={setShowAddTouchpoint}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau point de contact</DialogTitle>
            <DialogDescription>
              Ajoutez une interaction sur le parcours du client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Canal</Label>
              <Select
                value={newTouchpoint.channel}
                onValueChange={(v) =>
                  setNewTouchpoint((p) => ({ ...p, channel: v as Channel }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((ch) => (
                    <SelectItem key={ch} value={ch}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: CHANNEL_CONFIG[ch].color }}
                        />
                        {CHANNEL_CONFIG[ch].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Libell\u00e9</Label>
              <Input
                placeholder="ex. Reel Instagram, Email #3, Appel d\u00e9couverte..."
                value={newTouchpoint.label}
                onChange={(e) =>
                  setNewTouchpoint((p) => ({ ...p, label: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={newTouchpoint.date}
                onChange={(e) =>
                  setNewTouchpoint((p) => ({ ...p, date: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>D\u00e9tail (optionnel)</Label>
              <Input
                placeholder="ex. Campagne Scaling Mars, T\u00e9moignage client..."
                value={newTouchpoint.detail}
                onChange={(e) =>
                  setNewTouchpoint((p) => ({ ...p, detail: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddTouchpoint(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddTouchpoint}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Channel Flow Visualization ──────────────────────────────
// Sankey-like visualization showing transitions between channels
function ChannelFlowViz({ journeys }: { journeys: CustomerJourney[] }) {
  const transitions = useMemo(() => {
    const transMap = new Map<string, number>();

    for (const journey of journeys) {
      const tps = journey.touchpoints;
      for (let i = 0; i < tps.length - 1; i++) {
        const from = tps[i].channel;
        const to = tps[i + 1].channel;
        if (from !== to) {
          const key = `${from}→${to}`;
          transMap.set(key, (transMap.get(key) || 0) + 1);
        }
      }
    }

    return Array.from(transMap.entries())
      .map(([key, count]) => {
        const [from, to] = key.split("→") as [Channel, Channel];
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 12); // Top 12 transitions
  }, [journeys]);

  if (transitions.length === 0) {
    return (
      <p className="text-sm text-text-muted text-center py-8">
        Pas assez de donn\u00e9es pour afficher les flux entre canaux.
      </p>
    );
  }

  const maxCount = transitions[0].count;

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-secondary mb-4">
        Les transitions les plus fr\u00e9quentes entre canaux dans les parcours
        de conversion.
      </p>
      {transitions.map((t, idx) => {
        const fromCfg = CHANNEL_CONFIG[t.from];
        const toCfg = CHANNEL_CONFIG[t.to];
        const widthPct = (t.count / maxCount) * 100;
        return (
          <div key={idx} className="flex items-center gap-3">
            <span
              className="text-xs px-2 py-1 rounded-md font-medium min-w-[120px] text-center whitespace-nowrap"
              style={{
                backgroundColor: `${fromCfg.color}15`,
                color: fromCfg.color,
                border: `1px solid ${fromCfg.color}30`,
              }}
            >
              {fromCfg.label}
            </span>
            <div className="flex-1 relative h-6 flex items-center">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: `${widthPct}%`,
                  background: `linear-gradient(to right, ${fromCfg.color}, ${toCfg.color})`,
                  minWidth: "20px",
                }}
              />
              <ArrowRight
                className="h-3.5 w-3.5 text-text-muted absolute"
                style={{ left: `${Math.max(widthPct - 2, 10)}%` }}
              />
            </div>
            <span
              className="text-xs px-2 py-1 rounded-md font-medium min-w-[120px] text-center whitespace-nowrap"
              style={{
                backgroundColor: `${toCfg.color}15`,
                color: toCfg.color,
                border: `1px solid ${toCfg.color}30`,
              }}
            >
              {toCfg.label}
            </span>
            <span className="text-xs text-text-muted tabular-nums min-w-[24px] text-right">
              {t.count}x
            </span>
          </div>
        );
      })}
    </div>
  );
}
