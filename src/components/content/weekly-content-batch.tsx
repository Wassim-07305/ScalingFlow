"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import {
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Film,
  Layers,
  FileText,
  BookImage,
  TrendingUp,
  Brain,
  Clock,
  BarChart3,
  Zap,
  Rocket,
  Library,
  Filter,
  Search,
  Loader2,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import type {
  WeeklyBatchResult,
  ContentPiece,
} from "@/lib/ai/prompts/continuous-content";

interface WeeklyContentBatchProps {
  className?: string;
}

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string; color: string }
> = {
  reel: { icon: Film, label: "Reel / Script", color: "text-orange-400" },
  carousel: { icon: Layers, label: "Carousel", color: "text-blue-400" },
  post: { icon: FileText, label: "Post", color: "text-emerald-400" },
  story: { icon: BookImage, label: "Story", color: "text-purple-400" },
};

const PILLAR_BADGE: Record<
  string,
  "default" | "blue" | "cyan" | "purple" | "yellow"
> = {
  Know: "blue",
  Like: "purple",
  Trust: "default",
  Conversion: "yellow",
};

const GLOW_MAP: Record<string, "orange" | "blue" | "emerald" | "purple"> = {
  reel: "orange",
  carousel: "blue",
  post: "emerald",
  story: "purple",
};

type PillarFilter = "all" | "Know" | "Like" | "Trust" | "Conversion";
type TypeFilter = "all" | "reel" | "carousel" | "post" | "story";
type GenerationMode = "hebdo" | "massive";

interface MassiveConfig {
  scriptCount: number;
  carouselCount: number;
  pillar: "Mix" | "Know" | "Like" | "Trust";
}

interface BatchProgress {
  totalBatches: number;
  completedBatches: number;
  totalPieces: number;
  generatedPieces: number;
  currentBatchLabel: string;
}

interface LibraryPiece {
  id: string;
  content_type: string;
  title: string;
  hook: string;
  content: string;
  hashtags: string[];
  published: boolean;
  ai_raw_response: ContentPiece | null;
  created_at: string;
}

export function WeeklyContentBatch({ className }: WeeklyContentBatchProps) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<WeeklyBatchResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{
    currentUsage: number;
    limit: number;
  } | null>(null);
  const [expandedCard, setExpandedCard] = React.useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = React.useState(true);
  const [performanceData, setPerformanceData] = React.useState("");
  const [objections, setObjections] = React.useState("");

  // Mode & massive config
  const [mode, setMode] = React.useState<GenerationMode>("hebdo");
  const [massiveConfig, setMassiveConfig] = React.useState<MassiveConfig>({
    scriptCount: 40,
    carouselCount: 20,
    pillar: "Mix",
  });

  // Massive generation state
  const [massiveLoading, setMassiveLoading] = React.useState(false);
  const [massiveResults, setMassiveResults] = React.useState<ContentPiece[]>(
    [],
  );
  const [batchProgress, setBatchProgress] =
    React.useState<BatchProgress | null>(null);
  const abortRef = React.useRef(false);

  // Filters for results grid
  const [pillarFilter, setPillarFilter] = React.useState<PillarFilter>("all");
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Library tab
  const [activeTab, setActiveTab] = React.useState("generate");
  const [libraryPieces, setLibraryPieces] = React.useState<LibraryPiece[]>([]);
  const [libraryLoading, setLibraryLoading] = React.useState(false);
  const [libraryPillarFilter, setLibraryPillarFilter] =
    React.useState<PillarFilter>("all");
  const [libraryTypeFilter, setLibraryTypeFilter] =
    React.useState<TypeFilter>("all");
  const [librarySearch, setLibrarySearch] = React.useState("");

  // ─── Weekly batch generation (original) ──────────────────────────
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const parsedObjections = objections
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((text) => ({ text, frequency: 5 }));

      const response = await fetch("/api/ai/generate-weekly-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          performance_data: performanceData
            ? { top_types: performanceData }
            : undefined,
          objections:
            parsedObjections.length > 0 ? parsedObjections : undefined,
          preferences: {},
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) {
            setUsageLimited(errData.usage);
            return;
          }
        }
        throw new Error("Erreur lors de la génération");
      }

      const data = await response.json();
      setResult(data.result as WeeklyBatchResult);
      setShowForm(false);
      toast.success("Batch de contenu hebdomadaire généré !");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Massive batch generation ─────────────────────────────────────
  const handleMassiveGenerate = async () => {
    setMassiveLoading(true);
    setMassiveResults([]);
    setError(null);
    abortRef.current = false;

    const totalPieces = massiveConfig.scriptCount + massiveConfig.carouselCount;
    const BATCH_SIZE = 5;
    const totalBatches = Math.ceil(totalPieces / BATCH_SIZE);

    setBatchProgress({
      totalBatches,
      completedBatches: 0,
      totalPieces,
      generatedPieces: 0,
      currentBatchLabel: "Préparation...",
    });

    const allPieces: ContentPiece[] = [];

    // Build the request plan: how many scripts and carousels per batch
    let remainingScripts = massiveConfig.scriptCount;
    let remainingCarousels = massiveConfig.carouselCount;

    const parsedObjections = objections
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text) => ({ text, frequency: 5 }));

    try {
      for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
        if (abortRef.current) {
          toast.info("Génération annulée");
          break;
        }

        // Calculate this batch composition
        const batchScripts = Math.min(remainingScripts, BATCH_SIZE);
        const batchCarousels = Math.min(
          remainingCarousels,
          BATCH_SIZE - batchScripts,
        );
        const batchTotal = batchScripts + batchCarousels;

        if (batchTotal === 0) break;

        remainingScripts -= batchScripts;
        remainingCarousels -= batchCarousels;

        // Determine pillar focus for this batch
        const pillars: string[] = [];
        if (massiveConfig.pillar === "Mix") {
          const pillarCycle = ["Know", "Like", "Trust"];
          pillars.push(pillarCycle[batchIdx % 3]);
        } else {
          pillars.push(massiveConfig.pillar);
        }

        setBatchProgress((prev) =>
          prev
            ? {
                ...prev,
                completedBatches: batchIdx,
                currentBatchLabel: `Lot ${batchIdx + 1}/${totalBatches} — ${batchScripts} scripts, ${batchCarousels} carousels (${pillars[0]})`,
              }
            : null,
        );

        // Build type preference hint for the API
        const typeHint =
          batchScripts > 0 && batchCarousels > 0
            ? `Génère ${batchScripts} scripts (reels) et ${batchCarousels} carousels. Pilier principal : ${pillars[0]}.`
            : batchScripts > 0
              ? `Génère ${batchScripts} scripts (reels) uniquement. Pilier principal : ${pillars[0]}.`
              : `Génère ${batchCarousels} carousels uniquement. Pilier principal : ${pillars[0]}.`;

        const response = await fetch("/api/ai/generate-weekly-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            performance_data: performanceData
              ? {
                  top_types: `${performanceData}\n\n[INSTRUCTION BATCH]: ${typeHint}`,
                }
              : { top_types: `[INSTRUCTION BATCH]: ${typeHint}` },
            objections:
              parsedObjections.length > 0 ? parsedObjections : undefined,
            preferences: {
              pillar: pillars[0],
              batchMode: true,
            },
          }),
        });

        if (!response.ok) {
          if (response.status === 403) {
            const errData = await response.json();
            if (errData.usage) {
              setUsageLimited(errData.usage);
              return;
            }
          }
          if (response.status === 429) {
            // Rate limited — wait and retry
            toast.info("Limite de débit atteinte, pause de 15 secondes...");
            await new Promise((r) => setTimeout(r, 15000));
            // Undo the decrements so we retry this batch
            remainingScripts += batchScripts;
            remainingCarousels += batchCarousels;
            continue;
          }
          throw new Error(`Erreur lot ${batchIdx + 1}: ${response.statusText}`);
        }

        const data = await response.json();
        const batchResult = data.result as WeeklyBatchResult;

        if (batchResult?.contenus) {
          allPieces.push(...batchResult.contenus);
          setMassiveResults([...allPieces]);

          setBatchProgress((prev) =>
            prev
              ? {
                  ...prev,
                  completedBatches: batchIdx + 1,
                  generatedPieces: allPieces.length,
                }
              : null,
          );
        }

        // Small delay between batches to respect rate limits
        if (batchIdx < totalBatches - 1) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      if (allPieces.length > 0) {
        toast.success(
          `Machine à contenu terminée ! ${allPieces.length} contenus générés.`,
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg);
      toast.error(msg);
    } finally {
      setMassiveLoading(false);
      setBatchProgress(null);
    }
  };

  const handleCancelMassive = () => {
    abortRef.current = true;
  };

  // ─── Library ─────────────────────────────────────────────────────
  const fetchLibrary = React.useCallback(async () => {
    setLibraryLoading(true);
    try {
      const response = await fetch("/api/ai/generate-weekly-content?library=1");
      if (response.ok) {
        const data = await response.json();
        setLibraryPieces(data.pieces || []);
      }
    } catch {
      // silent
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === "library") {
      fetchLibrary();
    }
  }, [activeTab, fetchLibrary]);

  // ─── Helpers ──────────────────────────────────────────────────────
  const copyToClipboard = (piece: ContentPiece, key: string) => {
    const text = `Hook: ${piece.hook}\n\n${piece.script}\n\nHashtags: ${piece.hashtags.join(" ")}\n\nMeilleur moment: ${piece.best_posting_time}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(key);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success("Copié !");
  };

  const filterPieces = <T extends ContentPiece>(
    pieces: T[],
    pf: PillarFilter,
    tf: TypeFilter,
    sq: string,
  ): T[] => {
    return pieces.filter((p) => {
      if (pf !== "all" && p.pillar !== pf) return false;
      if (tf !== "all" && p.type !== tf) return false;
      if (
        sq &&
        !p.hook.toLowerCase().includes(sq.toLowerCase()) &&
        !p.script.toLowerCase().includes(sq.toLowerCase())
      )
        return false;
      return true;
    });
  };

  const mapContentTypeToPieceType = (ct: string): ContentPiece["type"] => {
    if (ct.includes("reel")) return "reel";
    if (ct.includes("carousel")) return "carousel";
    if (ct.includes("story")) return "story";
    return "post";
  };

  // ─── Render helpers ───────────────────────────────────────────────
  if (usageLimited) {
    return (
      <UpgradeWall
        currentUsage={usageLimited.currentUsage}
        limit={usageLimited.limit}
        className={className}
      />
    );
  }

  const renderContentCard = (
    piece: ContentPiece,
    index: number,
    keyPrefix: string,
  ) => {
    const isExpanded = expandedCard === index;
    const config = TYPE_CONFIG[piece.type] || TYPE_CONFIG.post;
    const Icon = config.icon;
    const copyKey = `${keyPrefix}-${index}`;

    return (
      <GlowCard key={copyKey} glowColor={GLOW_MAP[piece.type] || "emerald"}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant={PILLAR_BADGE[piece.pillar] || "default"}>
              {piece.pillar}
            </Badge>
            <div className={cn("flex items-center gap-1", config.color)}>
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{config.label}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(piece, copyKey)}
          >
            {copiedIndex === copyKey ? (
              <Check className="h-3 w-3 mr-1" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            {copiedIndex === copyKey ? "Copié !" : "Copier"}
          </Button>
        </div>

        {/* Hook */}
        <div className="mb-3">
          <p className="text-xs text-text-muted mb-0.5">Hook</p>
          <p className="text-sm font-medium text-accent">{piece.hook}</p>
        </div>

        {/* Script (expandable) */}
        <button
          className="w-full text-left"
          onClick={() => setExpandedCard(isExpanded ? null : index)}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-text-muted">Script / Contenu</p>
            {isExpanded ? (
              <ChevronUp className="h-3 w-3 text-text-muted" />
            ) : (
              <ChevronDown className="h-3 w-3 text-text-muted" />
            )}
          </div>
          <p
            className={cn(
              "text-sm text-text-secondary whitespace-pre-wrap",
              !isExpanded && "line-clamp-3",
            )}
          >
            {piece.script}
          </p>
        </button>

        {/* Posting time */}
        <div className="flex items-center gap-1.5 mt-3 text-text-muted">
          <Clock className="h-3 w-3" />
          <span className="text-xs">{piece.best_posting_time}</span>
        </div>

        {/* Reasoning */}
        {isExpanded && piece.reasoning && (
          <div className="mt-3 p-2 rounded-lg bg-accent/5 border border-accent/10">
            <p className="text-xs text-text-muted mb-0.5">
              Pourquoi ce contenu ?
            </p>
            <p className="text-xs text-text-secondary">{piece.reasoning}</p>
          </div>
        )}

        {/* Hashtags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {(piece.hashtags ?? []).map((h, j) => (
            <span key={j} className="text-xs text-info">
              {h.startsWith("#") ? h : `#${h}`}
            </span>
          ))}
        </div>
      </GlowCard>
    );
  };

  const renderFilterBar = (
    pf: PillarFilter,
    setPf: (v: PillarFilter) => void,
    tf: TypeFilter,
    setTf: (v: TypeFilter) => void,
    sq: string,
    setSq: (v: string) => void,
    count: number,
    totalCount: number,
  ) => (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-muted" />
          <Select value={pf} onValueChange={(v) => setPf(v as PillarFilter)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Pilier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les piliers</SelectItem>
              <SelectItem value="Know">Know</SelectItem>
              <SelectItem value="Like">Like</SelectItem>
              <SelectItem value="Trust">Trust</SelectItem>
              <SelectItem value="Conversion">Conversion</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Select value={tf} onValueChange={(v) => setTf(v as TypeFilter)}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="reel">Reel / Script</SelectItem>
            <SelectItem value="carousel">Carousel</SelectItem>
            <SelectItem value="post">Post</SelectItem>
            <SelectItem value="story">Story</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
          <Input
            value={sq}
            onChange={(e) => setSq(e.target.value)}
            placeholder="Rechercher dans les hooks et scripts..."
            className="h-8 text-xs pl-8"
          />
        </div>
      </div>
      <p className="text-xs text-text-muted">
        {count} contenu{count > 1 ? "s" : ""} affiché{count > 1 ? "s" : ""} sur{" "}
        {totalCount}
      </p>
    </div>
  );

  // ─── Massive progress indicator ──────────────────────────────────
  const renderMassiveProgress = () => {
    if (!batchProgress) return null;
    const pct = Math.round(
      (batchProgress.completedBatches / batchProgress.totalBatches) * 100,
    );

    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Loader2 className="h-8 w-8 text-accent animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  Machine à contenu en cours...
                </h3>
                <p className="text-sm text-text-secondary">
                  {batchProgress.currentBatchLabel}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Progression</span>
                <span className="text-accent font-medium">{pct}%</span>
              </div>
              <Progress value={pct} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-bg-tertiary">
                <p className="text-lg font-bold text-text-primary">
                  {batchProgress.completedBatches}
                </p>
                <p className="text-xs text-text-muted">
                  Lots terminés / {batchProgress.totalBatches}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-bg-tertiary">
                <p className="text-lg font-bold text-accent">
                  {batchProgress.generatedPieces}
                </p>
                <p className="text-xs text-text-muted">Contenus générés</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-bg-tertiary">
                <p className="text-lg font-bold text-text-primary">
                  {batchProgress.totalPieces}
                </p>
                <p className="text-xs text-text-muted">Objectif total</p>
              </div>
            </div>

            {/* Live preview of generated pieces */}
            {massiveResults.length > 0 && (
              <div className="border-t border-border-default pt-4">
                <p className="text-xs text-text-muted mb-2">
                  Derniers contenus générés :
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {massiveResults.slice(-3).map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-lg bg-bg-secondary"
                    >
                      <Badge
                        variant={PILLAR_BADGE[p.pillar] || "default"}
                        className="text-[10px]"
                      >
                        {p.pillar}
                      </Badge>
                      <span
                        className={cn(
                          "text-xs",
                          TYPE_CONFIG[p.type]?.color || "text-text-secondary",
                        )}
                      >
                        {TYPE_CONFIG[p.type]?.label || p.type}
                      </span>
                      <span className="text-xs text-text-secondary truncate flex-1">
                        {p.hook}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleCancelMassive}
            >
              Annuler la génération
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ─── Main render ──────────────────────────────────────────────────
  if (loading) {
    return (
      <AILoading
        text="Génération du batch hebdomadaire avec adaptation intelligente"
        className={className}
      />
    );
  }

  if (massiveLoading) {
    return renderMassiveProgress();
  }

  // Show massive results
  if (massiveResults.length > 0 && !showForm) {
    const filtered = filterPieces(
      massiveResults,
      pillarFilter,
      typeFilter,
      searchQuery,
    );

    // Compute stats
    const scriptCount = massiveResults.filter(
      (p) => p.type === "reel" || p.type === "post" || p.type === "story",
    ).length;
    const carouselCount = massiveResults.filter(
      (p) => p.type === "carousel",
    ).length;
    const pillarCounts = massiveResults.reduce(
      (acc, p) => {
        acc[p.pillar] = (acc[p.pillar] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return (
      <div className={cn("space-y-6", className)}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="generate" className="flex-1">
              <Rocket className="h-4 w-4 mr-1.5" />
              Résultats
            </TabsTrigger>
            <TabsTrigger value="library" className="flex-1">
              <Library className="h-4 w-4 mr-1.5" />
              Bibliothèque
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <Package className="h-5 w-5 text-accent" />
                  Machine à contenu — {massiveResults.length} contenus
                </h3>
                <p className="text-sm text-text-secondary mt-0.5">
                  {scriptCount} scripts + {carouselCount} carousels
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(true);
                    setMassiveResults([]);
                  }}
                >
                  Nouvelle génération
                </Button>
              </div>
            </div>

            {/* Pillar distribution */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-accent" />
                  <p className="text-sm font-medium text-text-primary">
                    Répartition par pilier
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(["Know", "Like", "Trust", "Conversion"] as const).map(
                    (pillar) => (
                      <div
                        key={pillar}
                        className="text-center p-3 rounded-lg bg-bg-tertiary"
                      >
                        <Badge variant={PILLAR_BADGE[pillar]} className="mb-1">
                          {pillar}
                        </Badge>
                        <p className="text-lg font-bold text-text-primary">
                          {pillarCounts[pillar] || 0}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            {renderFilterBar(
              pillarFilter,
              setPillarFilter,
              typeFilter,
              setTypeFilter,
              searchQuery,
              setSearchQuery,
              filtered.length,
              massiveResults.length,
            )}

            {/* Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((piece, i) =>
                renderContentCard(piece, i, "massive"),
              )}
            </div>

            {filtered.length === 0 && (
              <p className="text-center text-sm text-text-muted py-8">
                Aucun contenu ne correspond aux filtres sélectionnés.
              </p>
            )}
          </TabsContent>

          <TabsContent value="library">{renderLibraryTab()}</TabsContent>
        </Tabs>
      </div>
    );
  }

  // Show weekly results
  if (result && !showForm) {
    const { adaptation_intelligente, contenus } = result;
    const filtered = filterPieces(
      contenus,
      pillarFilter,
      typeFilter,
      searchQuery,
    );

    return (
      <div className={cn("space-y-6", className)}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="generate" className="flex-1">
              <Zap className="h-4 w-4 mr-1.5" />
              Résultats
            </TabsTrigger>
            <TabsTrigger value="library" className="flex-1">
              <Library className="h-4 w-4 mr-1.5" />
              Bibliothèque
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {result.semaine}
                </h3>
                <p className="text-sm text-text-secondary mt-0.5">
                  {contenus.length} contenus générés
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(true)}
                >
                  Nouveau batch
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerate}>
                  <Sparkles className="h-3 w-3 mr-1" />
                  Régénérer
                </Button>
              </div>
            </div>

            {/* Adaptation intelligente indicator */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-accent" />
                  <p className="text-sm font-medium text-text-primary">
                    Adaptation intelligente
                  </p>
                </div>
                <p className="text-sm text-text-secondary mb-4">
                  {adaptation_intelligente.raison}
                </p>

                {/* Distribution bars */}
                <div className="space-y-2">
                  {(adaptation_intelligente.repartition ?? []).map((item) => {
                    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.post;
                    const Icon = config.icon;
                    return (
                      <div key={item.type} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-4 w-4", config.color)} />
                            <span className="text-text-secondary">
                              {config.label}
                            </span>
                          </div>
                          <span className={cn("font-medium", config.color)}>
                            {item.pourcentage}%
                          </span>
                        </div>
                        <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              item.type === "reel"
                                ? "bg-orange-400"
                                : item.type === "carousel"
                                  ? "bg-blue-400"
                                  : item.type === "story"
                                    ? "bg-purple-400"
                                    : "bg-emerald-400",
                            )}
                            style={{ width: `${item.pourcentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {adaptation_intelligente.type_dominant && (
                  <div className="mt-3 p-2 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-xs text-accent text-center">
                      Type dominant :{" "}
                      <span className="font-semibold">
                        {TYPE_CONFIG[adaptation_intelligente.type_dominant]
                          ?.label || adaptation_intelligente.type_dominant}
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Filters */}
            {renderFilterBar(
              pillarFilter,
              setPillarFilter,
              typeFilter,
              setTypeFilter,
              searchQuery,
              setSearchQuery,
              filtered.length,
              contenus.length,
            )}

            {/* Content cards grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((piece, i) =>
                renderContentCard(piece, i, "weekly"),
              )}
            </div>
          </TabsContent>

          <TabsContent value="library">{renderLibraryTab()}</TabsContent>
        </Tabs>
      </div>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-6", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="generate" className="flex-1">
            <Sparkles className="h-4 w-4 mr-1.5" />
            Générer
          </TabsTrigger>
          <TabsTrigger value="library" className="flex-1">
            <Library className="h-4 w-4 mr-1.5" />
            Bibliothèque
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                Machine à contenu
              </CardTitle>
              <CardDescription>
                Génère des contenus en masse ou un batch hebdomadaire de 5
                contenus. L&apos;IA adapte automatiquement les formats à tes
                performances.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Mode selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode("hebdo")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
                    mode === "hebdo"
                      ? "border-accent bg-accent/10 text-text-primary"
                      : "border-border-default bg-bg-tertiary text-text-secondary hover:border-border-default/80",
                  )}
                >
                  <Zap
                    className={cn(
                      "h-6 w-6",
                      mode === "hebdo" ? "text-accent" : "text-text-muted",
                    )}
                  />
                  <span className="text-sm font-medium">Batch hebdo</span>
                  <span className="text-xs text-text-muted">5 contenus</span>
                </button>
                <button
                  onClick={() => setMode("massive")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
                    mode === "massive"
                      ? "border-accent bg-accent/10 text-text-primary"
                      : "border-border-default bg-bg-tertiary text-text-secondary hover:border-border-default/80",
                  )}
                >
                  <Rocket
                    className={cn(
                      "h-6 w-6",
                      mode === "massive" ? "text-accent" : "text-text-muted",
                    )}
                  />
                  <span className="text-sm font-medium">
                    Génération massive
                  </span>
                  <span className="text-xs text-text-muted">
                    Jusqu&apos;à 100 contenus
                  </span>
                </button>
              </div>

              {/* Massive config */}
              {mode === "massive" && (
                <div className="space-y-4 p-4 rounded-xl border border-accent/20 bg-accent/5">
                  <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-accent" />
                    Configuration de la génération massive
                  </h4>

                  {/* Script count */}
                  <div>
                    <label className="text-sm font-medium text-text-primary mb-1 block">
                      <Film className="inline h-4 w-4 mr-1 text-orange-400" />
                      Nombre de scripts (Reels / Stories)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={10}
                        max={60}
                        step={5}
                        value={massiveConfig.scriptCount}
                        onChange={(e) =>
                          setMassiveConfig((prev) => ({
                            ...prev,
                            scriptCount: parseInt(e.target.value),
                          }))
                        }
                        className="flex-1 accent-accent h-2 cursor-pointer"
                      />
                      <span className="text-sm font-bold text-accent w-8 text-right">
                        {massiveConfig.scriptCount}
                      </span>
                    </div>
                  </div>

                  {/* Carousel count */}
                  <div>
                    <label className="text-sm font-medium text-text-primary mb-1 block">
                      <Layers className="inline h-4 w-4 mr-1 text-blue-400" />
                      Nombre de carousels
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={10}
                        max={40}
                        step={5}
                        value={massiveConfig.carouselCount}
                        onChange={(e) =>
                          setMassiveConfig((prev) => ({
                            ...prev,
                            carouselCount: parseInt(e.target.value),
                          }))
                        }
                        className="flex-1 accent-accent h-2 cursor-pointer"
                      />
                      <span className="text-sm font-bold text-accent w-8 text-right">
                        {massiveConfig.carouselCount}
                      </span>
                    </div>
                  </div>

                  {/* Pillar selection */}
                  <div>
                    <label className="text-sm font-medium text-text-primary mb-2 block">
                      <Brain className="inline h-4 w-4 mr-1 text-accent" />
                      Pilier principal
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["Mix", "Know", "Like", "Trust"] as const).map(
                        (pillar) => (
                          <button
                            key={pillar}
                            onClick={() =>
                              setMassiveConfig((prev) => ({
                                ...prev,
                                pillar,
                              }))
                            }
                            className={cn(
                              "py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                              massiveConfig.pillar === pillar
                                ? "border-accent bg-accent/15 text-accent"
                                : "border-border-default bg-bg-tertiary text-text-secondary hover:bg-bg-secondary",
                            )}
                          >
                            {pillar === "Mix" ? "Mix (tous)" : pillar}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-3 rounded-lg bg-bg-secondary border border-border-default">
                    <p className="text-xs text-text-muted mb-1">Résumé</p>
                    <p className="text-sm text-text-primary">
                      <span className="text-accent font-bold">
                        {massiveConfig.scriptCount +
                          massiveConfig.carouselCount}
                      </span>{" "}
                      contenus au total :{" "}
                      <span className="text-orange-400">
                        {massiveConfig.scriptCount} scripts
                      </span>{" "}
                      +{" "}
                      <span className="text-blue-400">
                        {massiveConfig.carouselCount} carousels
                      </span>
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Environ{" "}
                      {Math.ceil(
                        (massiveConfig.scriptCount +
                          massiveConfig.carouselCount) /
                          5,
                      )}{" "}
                      appels API séquentiels (lots de 5)
                    </p>
                  </div>
                </div>
              )}

              {/* Performance data */}
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">
                  <TrendingUp className="inline h-4 w-4 mr-1 text-accent" />
                  Données de performance{" "}
                  <span className="text-text-muted font-normal">
                    (optionnel)
                  </span>
                </label>
                <p className="text-xs text-text-muted mb-2">
                  Quels types de contenu ont le mieux fonctionné cette semaine ?
                </p>
                <textarea
                  value={performanceData}
                  onChange={(e) => setPerformanceData(e.target.value)}
                  placeholder="Ex: Les Reels ont eu 3x plus de vues que les posts. Le carousel sur les erreurs a eu beaucoup de saves. Les stories avec des sondages marchent bien."
                  className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                  rows={3}
                />
              </div>

              {/* Sales objections */}
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">
                  <Brain className="inline h-4 w-4 mr-1 text-accent" />
                  Objections de vente entendues{" "}
                  <span className="text-text-muted font-normal">
                    (optionnel)
                  </span>
                </label>
                <p className="text-xs text-text-muted mb-2">
                  Une objection par ligne. L&apos;IA créera du contenu qui les
                  adresse.
                </p>
                <textarea
                  value={objections}
                  onChange={(e) => setObjections(e.target.value)}
                  placeholder={
                    "C'est trop cher\nJe n'ai pas le temps\nJe peux le faire seul\nJe ne suis pas sûr que ça marche pour moi"
                  }
                  className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                  rows={4}
                />
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}

              {mode === "hebdo" ? (
                <>
                  <Button size="lg" onClick={handleGenerate} className="w-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer le batch de la semaine
                  </Button>
                  <p className="text-xs text-text-muted text-center">
                    5 contenus optimisés avec adaptation intelligente aux
                    performances
                  </p>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={handleMassiveGenerate}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    Lancer la machine à contenu (
                    {massiveConfig.scriptCount +
                      massiveConfig.carouselCount}{" "}
                    contenus)
                  </Button>
                  <p className="text-xs text-text-muted text-center">
                    La génération se fait par lots de 5 et peut prendre quelques
                    minutes. Vous pouvez annuler à tout moment.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library">{renderLibraryTab()}</TabsContent>
      </Tabs>
    </div>
  );

  // ─── Library tab renderer ─────────────────────────────────────────
  function renderLibraryTab() {
    if (libraryLoading) {
      return (
        <AILoading text="Chargement de la bibliothèque..." variant="minimal" />
      );
    }

    // Map library pieces to ContentPiece-like for filtering
    const mappedPieces: (ContentPiece & { id: string; created_at: string })[] =
      libraryPieces.map((lp) => ({
        id: lp.id,
        created_at: lp.created_at,
        type:
          lp.ai_raw_response?.type ||
          mapContentTypeToPieceType(lp.content_type),
        pillar: lp.ai_raw_response?.pillar || "Know",
        hook: lp.ai_raw_response?.hook || lp.hook || "",
        script: lp.ai_raw_response?.script || lp.content || "",
        hashtags: lp.ai_raw_response?.hashtags || lp.hashtags || [],
        best_posting_time: lp.ai_raw_response?.best_posting_time || "",
        reasoning: lp.ai_raw_response?.reasoning || "",
      }));

    const filtered = filterPieces(
      mappedPieces,
      libraryPillarFilter,
      libraryTypeFilter,
      librarySearch,
    );

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <Library className="h-5 w-5 text-accent" />
              Bibliothèque de contenus
            </h3>
            <p className="text-sm text-text-secondary mt-0.5">
              {libraryPieces.length} contenu
              {libraryPieces.length > 1 ? "s" : ""} sauvegardé
              {libraryPieces.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLibrary}>
            <Sparkles className="h-3 w-3 mr-1" />
            Actualiser
          </Button>
        </div>

        {libraryPieces.length > 0 && (
          <>
            {renderFilterBar(
              libraryPillarFilter,
              setLibraryPillarFilter,
              libraryTypeFilter,
              setLibraryTypeFilter,
              librarySearch,
              setLibrarySearch,
              filtered.length,
              mappedPieces.length,
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((piece, i) => (
                <div key={piece.id} className="relative">
                  {renderContentCard(piece, i + 10000, "lib")}
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] text-text-muted">
                      {new Date(piece.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <p className="text-center text-sm text-text-muted py-8">
                Aucun contenu ne correspond aux filtres sélectionnés.
              </p>
            )}
          </>
        )}

        {libraryPieces.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Library className="h-10 w-10 text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-secondary">
                Aucun contenu sauvegardé pour le moment.
              </p>
              <p className="text-xs text-text-muted mt-1">
                Générez vos premiers contenus pour les retrouver ici.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
}
