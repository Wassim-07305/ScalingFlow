"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import {
  Users,
  Snowflake,
  Flame,
  ThermometerSun,
  Ban,
  Plus,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Link2,
  Search,
  X,
  Target,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────

interface Audience {
  id: string;
  name: string;
  audience_type: "cold" | "warm" | "hot" | "exclusion";
  subtype: string;
  status: "ready" | "draft" | "targeting" | "error";
  meta_audience_id: string | null;
  source_data: Record<string, unknown> | null;
  created_at: string;
}

// ─── Constants ──────────────────────────────────────────────

const WARM_SOURCES = [
  { value: "website_visitors", label: "Visiteurs du site web" },
  { value: "ig_engagers", label: "Engagers Instagram" },
  { value: "video_viewers", label: "Viewers vidéo" },
  { value: "page_engagers", label: "Engagers page Facebook" },
];

const WARM_DAYS = [
  { value: "7", label: "7 jours" },
  { value: "14", label: "14 jours" },
  { value: "30", label: "30 jours" },
  { value: "60", label: "60 jours" },
  { value: "90", label: "90 jours" },
];

const HOT_SOURCES = [
  { value: "optins", label: "Opt-ins" },
  { value: "customers", label: "Clients existants" },
  { value: "qualified_leads", label: "Leads qualifiés" },
];

const PREDEFINED_INTERESTS = [
  "Entrepreneuriat",
  "Marketing digital",
  "E-commerce",
  "Coaching",
  "Développement personnel",
  "Business en ligne",
  "Freelance",
  "Formation en ligne",
  "SaaS",
  "Immobilier",
  "Investissement",
  "Fitness",
  "Bien-être",
  "Mode",
  "Beauté",
  "Alimentation saine",
  "Voyage",
  "Technologie",
  "Intelligence artificielle",
  "Réseaux sociaux",
];

// ─── Component ──────────────────────────────────────────────

export function AudienceBuilder() {
  const { user } = useUser();
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [metaConnected, setMetaConnected] = useState<boolean | null>(null);

  // Cold form state
  const [coldMode, setColdMode] = useState<"interests" | "lookalike">(
    "interests",
  );
  const [coldName, setColdName] = useState("");
  const [coldInterests, setColdInterests] = useState<string[]>([]);
  const [coldInterestSearch, setColdInterestSearch] = useState("");
  const [coldLlaSource, setColdLlaSource] = useState("");
  const [coldLlaPercentage, setColdLlaPercentage] = useState(1);
  const [coldAgeMin, setColdAgeMin] = useState(25);
  const [coldAgeMax, setColdAgeMax] = useState(55);
  const [coldGender, setColdGender] = useState<"all" | "male" | "female">(
    "all",
  );
  const [coldCountry, setColdCountry] = useState("FR");

  // Warm form state
  const [warmName, setWarmName] = useState("");
  const [warmSource, setWarmSource] = useState("website_visitors");
  const [warmDays, setWarmDays] = useState("30");

  // Hot form state
  const [hotName, setHotName] = useState("");
  const [hotSource, setHotSource] = useState("optins");
  const [hotDays, setHotDays] = useState("30");

  // Exclusion form state
  const [excludedAudienceIds, setExcludedAudienceIds] = useState<string[]>([]);
  const [exclusionName, setExclusionName] = useState("");

  // ─── Fetch Audiences ────────────────────────────────────────

  const fetchAudiences = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/meta/audiences");
      const data = await res.json();
      if (data.audiences) {
        setAudiences(data.audiences);
        setMetaConnected(true);
      }
    } catch {
      // If fetch fails, assume Meta not connected
      setMetaConnected(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAudiences();
  }, [fetchAudiences]);

  // ─── Create Audience ────────────────────────────────────────

  const createAudience = async (
    type: "cold" | "warm" | "hot" | "exclusion",
    name: string,
    config: Record<string, unknown>,
  ) => {
    setCreating(true);
    try {
      const res = await fetch("/api/integrations/meta/audiences/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name, config }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "META_NOT_CONNECTED") {
          setMetaConnected(false);
        }
        toast.error(data.error || "Erreur lors de la création");
        return;
      }

      toast.success(`Audience "${name}" créée avec succès`);
      fetchAudiences();

      // Reset forms
      if (type === "cold") {
        setColdName("");
        setColdInterests([]);
        setColdLlaSource("");
        setColdLlaPercentage(1);
      } else if (type === "warm") {
        setWarmName("");
      } else if (type === "hot") {
        setHotName("");
      } else {
        setExclusionName("");
        setExcludedAudienceIds([]);
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setCreating(false);
    }
  };

  // ─── Handlers ───────────────────────────────────────────────

  const handleCreateCold = () => {
    if (!coldName.trim()) {
      toast.error("Donne un nom à ton audience");
      return;
    }

    if (coldMode === "interests" && coldInterests.length === 0) {
      toast.error("Sélectionne au moins un centre d'intérêt");
      return;
    }

    if (coldMode === "lookalike" && !coldLlaSource) {
      toast.error("Sélectionne une audience source pour le lookalike");
      return;
    }

    createAudience("cold", coldName, {
      mode: coldMode,
      interests: coldMode === "interests" ? coldInterests : undefined,
      source_audience_id: coldMode === "lookalike" ? coldLlaSource : undefined,
      percentage: coldMode === "lookalike" ? coldLlaPercentage : undefined,
      country: coldCountry,
      age_min: coldAgeMin,
      age_max: coldAgeMax,
      gender: coldGender,
    });
  };

  const handleCreateWarm = () => {
    if (!warmName.trim()) {
      toast.error("Donne un nom à ton audience");
      return;
    }
    createAudience("warm", warmName, {
      source: warmSource,
      days: parseInt(warmDays),
    });
  };

  const handleCreateHot = () => {
    if (!hotName.trim()) {
      toast.error("Donne un nom à ton audience");
      return;
    }
    createAudience("hot", hotName, {
      source: hotSource,
      days: parseInt(hotDays),
    });
  };

  const handleCreateExclusion = () => {
    if (!exclusionName.trim()) {
      toast.error("Donne un nom à ton exclusion");
      return;
    }
    if (excludedAudienceIds.length === 0) {
      toast.error("Sélectionne au moins une audience à exclure");
      return;
    }
    createAudience("exclusion", exclusionName, {
      excluded_ids: excludedAudienceIds,
    });
  };

  const toggleInterest = (interest: string) => {
    setColdInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const toggleExcludedAudience = (id: string) => {
    setExcludedAudienceIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const filteredInterests = PREDEFINED_INTERESTS.filter((i) =>
    i.toLowerCase().includes(coldInterestSearch.toLowerCase()),
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "cold":
        return <Snowflake className="h-3.5 w-3.5" />;
      case "warm":
        return <ThermometerSun className="h-3.5 w-3.5" />;
      case "hot":
        return <Flame className="h-3.5 w-3.5" />;
      case "exclusion":
        return <Ban className="h-3.5 w-3.5" />;
      default:
        return <Users className="h-3.5 w-3.5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "cold":
        return "Froide";
      case "warm":
        return "Tiède";
      case "hot":
        return "Chaude";
      case "exclusion":
        return "Exclusion";
      default:
        return type;
    }
  };

  const getTypeBadgeVariant = (
    type: string,
  ): "blue" | "yellow" | "red" | "muted" => {
    switch (type) {
      case "cold":
        return "blue";
      case "warm":
        return "yellow";
      case "hot":
        return "red";
      default:
        return "muted";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Prête
          </Badge>
        );
      case "targeting":
        return (
          <Badge variant="blue" className="gap-1">
            <Target className="h-3 w-3" />
            Ciblage
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="yellow" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Brouillon
          </Badge>
        );
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  // ─── Meta Not Connected CTA ────────────────────────────────

  if (metaConnected === false) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-2xl bg-blue-500/10 mb-4">
              <Link2 className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Connecte ton compte Meta Ads
            </h3>
            <p className="text-sm text-text-secondary max-w-md mb-6">
              Pour créer et gérer tes audiences personnalisées, connecte ton
              compte Meta Ads. Tu pourras ensuite configurer tes audiences
              froides, tièdes et chaudes directement depuis ScalingFlow.
            </p>
            <Button asChild>
              <a href="/api/integrations/meta/connect">
                <Link2 className="h-4 w-4 mr-2" />
                Connecter Meta Ads
              </a>
            </Button>
            <p className="text-xs text-text-muted mt-3">
              Tu peux aussi configurer tes clés API dans{" "}
              <a href="/settings" className="text-accent hover:underline">
                Paramètres
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Loading ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────

  const existingAudiencesForLLA = audiences.filter(
    (a) => a.meta_audience_id && a.audience_type !== "exclusion",
  );

  return (
    <div className="space-y-6">
      {/* Audience Creation Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            Créer une audience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cold">
            <TabsList className="w-full">
              <TabsTrigger value="cold" className="flex-1 gap-1.5">
                <Snowflake className="h-3.5 w-3.5" />
                Froide
              </TabsTrigger>
              <TabsTrigger value="warm" className="flex-1 gap-1.5">
                <ThermometerSun className="h-3.5 w-3.5" />
                Tiède
              </TabsTrigger>
              <TabsTrigger value="hot" className="flex-1 gap-1.5">
                <Flame className="h-3.5 w-3.5" />
                Chaude
              </TabsTrigger>
              <TabsTrigger value="exclusion" className="flex-1 gap-1.5">
                <Ban className="h-3.5 w-3.5" />
                Exclusions
              </TabsTrigger>
            </TabsList>

            {/* ─── Cold Tab ─────────────────────────────────── */}
            <TabsContent value="cold">
              <div className="space-y-4">
                <p className="text-xs text-text-muted">
                  Audience froide : personnes qui ne te connaissent pas encore.
                  Cible par centres d&apos;intérêt ou crée un lookalike.
                </p>

                <div className="space-y-2">
                  <Label>Nom de l&apos;audience</Label>
                  <Input
                    placeholder="Ex: LLA 1% clients FR"
                    value={coldName}
                    onChange={(e) => setColdName(e.target.value)}
                  />
                </div>

                {/* Mode selector */}
                <div className="space-y-2">
                  <Label>Type de ciblage</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={
                        coldMode === "interests" ? "default" : "secondary"
                      }
                      size="sm"
                      onClick={() => setColdMode("interests")}
                    >
                      <Search className="h-3.5 w-3.5 mr-1" />
                      Centres d&apos;intérêt
                    </Button>
                    <Button
                      variant={
                        coldMode === "lookalike" ? "default" : "secondary"
                      }
                      size="sm"
                      onClick={() => setColdMode("lookalike")}
                    >
                      <Users className="h-3.5 w-3.5 mr-1" />
                      Lookalike (LLA)
                    </Button>
                  </div>
                </div>

                {coldMode === "interests" && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Centres d&apos;intérêt</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                        <Input
                          placeholder="Rechercher un intérêt..."
                          className="pl-9"
                          value={coldInterestSearch}
                          onChange={(e) =>
                            setColdInterestSearch(e.target.value)
                          }
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 rounded-lg bg-bg-tertiary border border-border-default">
                        {filteredInterests.map((interest) => (
                          <button
                            key={interest}
                            onClick={() => toggleInterest(interest)}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                              coldInterests.includes(interest)
                                ? "bg-accent text-bg-primary"
                                : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary border border-border-default",
                            )}
                          >
                            {interest}
                          </button>
                        ))}
                      </div>
                      {coldInterests.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {coldInterests.map((interest) => (
                            <Badge
                              key={interest}
                              variant="default"
                              className="gap-1"
                            >
                              {interest}
                              <button onClick={() => toggleInterest(interest)}>
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {coldMode === "lookalike" && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Audience source</Label>
                      <Select
                        value={coldLlaSource}
                        onValueChange={setColdLlaSource}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionne une audience source" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingAudiencesForLLA.length === 0 ? (
                            <SelectItem value="_none" disabled>
                              Aucune audience disponible
                            </SelectItem>
                          ) : (
                            existingAudiencesForLLA.map((a) => (
                              <SelectItem
                                key={a.id}
                                value={a.meta_audience_id!}
                              >
                                {a.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Pourcentage de similarité : {coldLlaPercentage}%
                      </Label>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={coldLlaPercentage}
                        onChange={(e) =>
                          setColdLlaPercentage(parseInt(e.target.value))
                        }
                        className="w-full accent-emerald-400"
                      />
                      <div className="flex justify-between text-[10px] text-text-muted">
                        <span>1% (plus similaire)</span>
                        <span>10% (plus large)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Demographics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Âge min</Label>
                    <Input
                      type="number"
                      min={18}
                      max={65}
                      value={coldAgeMin}
                      onChange={(e) =>
                        setColdAgeMin(parseInt(e.target.value) || 18)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Âge max</Label>
                    <Input
                      type="number"
                      min={18}
                      max={65}
                      value={coldAgeMax}
                      onChange={(e) =>
                        setColdAgeMax(parseInt(e.target.value) || 65)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Genre</Label>
                    <Select
                      value={coldGender}
                      onValueChange={(v) =>
                        setColdGender(v as "all" | "male" | "female")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="male">Hommes</SelectItem>
                        <SelectItem value="female">Femmes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pays</Label>
                    <Select value={coldCountry} onValueChange={setColdCountry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="BE">Belgique</SelectItem>
                        <SelectItem value="CH">Suisse</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="US">États-Unis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleCreateCold}
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Créer l&apos;audience froide
                </Button>
              </div>
            </TabsContent>

            {/* ─── Warm Tab ─────────────────────────────────── */}
            <TabsContent value="warm">
              <div className="space-y-4">
                <p className="text-xs text-text-muted">
                  Audience tiède : personnes qui ont déjà interagi avec toi
                  (visiteurs, engagers, viewers).
                </p>

                <div className="space-y-2">
                  <Label>Nom de l&apos;audience</Label>
                  <Input
                    placeholder="Ex: Visiteurs site 30j"
                    value={warmName}
                    onChange={(e) => setWarmName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select value={warmSource} onValueChange={setWarmSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WARM_SOURCES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Période de rétention</Label>
                  <Select value={warmDays} onValueChange={setWarmDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WARM_DAYS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCreateWarm}
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Créer l&apos;audience tiède
                </Button>
              </div>
            </TabsContent>

            {/* ─── Hot Tab ──────────────────────────────────── */}
            <TabsContent value="hot">
              <div className="space-y-4">
                <p className="text-xs text-text-muted">
                  Audience chaude : personnes déjà engagées (opt-ins, clients,
                  leads qualifiés). Idéal pour le retargeting et l&apos;upsell.
                </p>

                <div className="space-y-2">
                  <Label>Nom de l&apos;audience</Label>
                  <Input
                    placeholder="Ex: Clients existants 90j"
                    value={hotName}
                    onChange={(e) => setHotName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select value={hotSource} onValueChange={setHotSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOT_SOURCES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Période de rétention</Label>
                  <Select value={hotDays} onValueChange={setHotDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WARM_DAYS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCreateHot}
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Créer l&apos;audience chaude
                </Button>
              </div>
            </TabsContent>

            {/* ─── Exclusions Tab ───────────────────────────── */}
            <TabsContent value="exclusion">
              <div className="space-y-4">
                <p className="text-xs text-text-muted">
                  Exclusions : sélectionne les audiences à exclure de tes
                  campagnes (ex : clients existants pour l&apos;acquisition).
                </p>

                <div className="space-y-2">
                  <Label>Nom du groupe d&apos;exclusion</Label>
                  <Input
                    placeholder="Ex: Exclure clients actuels"
                    value={exclusionName}
                    onChange={(e) => setExclusionName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Audiences à exclure</Label>
                  {audiences.filter((a) => a.audience_type !== "exclusion")
                    .length === 0 ? (
                    <p className="text-xs text-text-muted py-4 text-center">
                      Crée d&apos;abord une audience froide, tiède ou chaude.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 rounded-lg bg-bg-tertiary border border-border-default">
                      {audiences
                        .filter((a) => a.audience_type !== "exclusion")
                        .map((a) => (
                          <button
                            key={a.id}
                            onClick={() => toggleExcludedAudience(a.id)}
                            className={cn(
                              "flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors",
                              excludedAudienceIds.includes(a.id)
                                ? "bg-red-500/10 border border-red-500/30 text-text-primary"
                                : "hover:bg-bg-secondary text-text-secondary",
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {getTypeIcon(a.audience_type)}
                              <span>{a.name}</span>
                            </div>
                            {excludedAudienceIds.includes(a.id) && (
                              <Ban className="h-3.5 w-3.5 text-red-400" />
                            )}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleCreateExclusion}
                  disabled={creating || excludedAudienceIds.length === 0}
                  className="w-full"
                  variant="destructive"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Ban className="h-4 w-4 mr-2" />
                  )}
                  Créer l&apos;exclusion ({excludedAudienceIds.length} audience
                  {excludedAudienceIds.length > 1 ? "s" : ""})
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ─── Audiences List ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              Audiences créées ({audiences.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {audiences.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-text-muted/40 mb-4" />
              <p className="text-sm text-text-muted">
                Aucune audience. Crée ta première audience ci-dessus pour
                commencer à cibler tes campagnes.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {audiences.map((audience) => (
                <div
                  key={audience.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border-default"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={getTypeBadgeVariant(audience.audience_type)}
                      className="gap-1"
                    >
                      {getTypeIcon(audience.audience_type)}
                      {getTypeLabel(audience.audience_type)}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {audience.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {audience.subtype}
                        {audience.meta_audience_id && (
                          <span> &middot; ID: {audience.meta_audience_id}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(audience.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
