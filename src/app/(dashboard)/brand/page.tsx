"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { NameGenerator } from "@/components/brand/name-generator";
import { StyleGuide } from "@/components/brand/style-guide";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Type,
  Palette,
  Hexagon,
  BookOpen,
  CheckCircle,
  XCircle,
  History,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { GenerationHistory } from "@/components/shared/generation-history";
import { LogoGenerator } from "@/components/brand/logo-generator";
import type { BrandIdentityResult } from "@/lib/ai/prompts/brand-identity";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

const BRAND_DIRECTIONS = [
  "Minimaliste",
  "Luxe",
  "Playful",
  "Professionnel",
  "Créatif",
] as const;

const COLOR_PREFERENCES = [
  "Emeraude",
  "Bleu",
  "Orange",
  "Violet",
  "Neutre",
  "Personnalisé",
] as const;

const TABS = [
  { key: "nom", label: "Nom", icon: Type },
  { key: "direction", label: "Direction Artistique", icon: Palette },
  { key: "logo", label: "Logo", icon: Hexagon },
  { key: "kit", label: "Kit de Marque", icon: BookOpen },
  { key: "history", label: "Historique", icon: History },
] as const;

export default function BrandPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = React.useState<string>("nom");
  const [loading, setLoading] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [brandId, setBrandId] = React.useState<string | null>(null);
  const [selectedName, setSelectedName] = React.useState<string | null>(null);
  const [generated, setGenerated] = React.useState<BrandIdentityResult | null>(null);
  const [offerId, setOfferId] = React.useState<string | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);
  const [brandDirection, setBrandDirection] = React.useState<string>(BRAND_DIRECTIONS[0]);
  const [industry, setIndustry] = React.useState("");
  const [colorPreference, setColorPreference] = React.useState<string>(COLOR_PREFERENCES[0]);

  // Fetch existing brand identity
  React.useEffect(() => {
    if (!user) return;

    const fetchBrand = async () => {
      setLoading(true);
      try {
        const supabase = createClient();

        // Fetch latest brand identity
        const { data: brand } = await supabase
          .from("brand_identities")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (brand) {
          setBrandId(brand.id);
          setSelectedName(brand.selected_name);
          setOfferId(brand.offer_id);

          // Reconstruct generated data from DB
          const brandNames = brand.brand_names as unknown as BrandIdentityResult["noms"] | null;
          const artDirection = brand.art_direction as unknown as BrandIdentityResult["direction_artistique"] | null;
          let logoConcept: BrandIdentityResult["logo_concept"] | null = null;
          try {
            logoConcept = brand.logo_concept
              ? (typeof brand.logo_concept === "string"
                  ? JSON.parse(brand.logo_concept)
                  : brand.logo_concept) as BrandIdentityResult["logo_concept"]
              : null;
          } catch {
            // logo_concept may be malformed JSON — ignore
          }
          const brandKit = brand.brand_kit as unknown as BrandIdentityResult["brand_kit"] | null;

          if (brandNames || artDirection || logoConcept || brandKit) {
            setGenerated({
              noms: brandNames || [],
              direction_artistique: artDirection || {
                palette: [],
                typographies: [],
                style_visuel: "",
                moodboard_description: "",
              },
              logo_concept: logoConcept || {
                description: "",
                forme: "",
                symbolisme: "",
                variations: [],
              },
              brand_kit: brandKit || {
                mission: "",
                vision: "",
                valeurs: [],
                ton: "",
                do_list: [],
                dont_list: [],
              },
            });
          }
        }

        // Also fetch user's latest offer for generation context
        const { data: offers } = await supabase
          .from("offers")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (offers && offers.length > 0) {
          setOfferId(offers[0].id);
        }
      } catch {
        // Brand fetch failed silently
      } finally {
        setLoading(false);
      }
    };

    fetchBrand();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      const response = await fetch("/api/ai/generate-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId,
          brandDirection,
          industry: industry || undefined,
          colorPreference,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 403 && errData.usage) { setUsageLimited(errData.usage); return; }
        throw new Error(errData.error || "Erreur lors de la génération");
      }

      const data = await response.json();
      setBrandId(data.id);
      setGenerated(data.generated);
      setSelectedName(null);
      toast.success("Identité de marque générée avec succès !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setGenerating(false);
    }
  };

  const handleHistorySelect = async (item: { id: string }) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("brand_identities")
        .select("*")
        .eq("id", item.id)
        .single();
      if (error || !data) {
        toast.error("Impossible de charger cette identité");
        return;
      }

      setBrandId(data.id);
      setSelectedName(data.selected_name);
      setOfferId(data.offer_id);

      const brandNames = data.brand_names as unknown as BrandIdentityResult["noms"] | null;
      const artDirection = data.art_direction as unknown as BrandIdentityResult["direction_artistique"] | null;
      let logoConcept = null;
      try {
        logoConcept = data.logo_concept
          ? (typeof data.logo_concept === "string"
              ? JSON.parse(data.logo_concept)
              : data.logo_concept)
          : null;
      } catch {
        // logo_concept may be malformed JSON — ignore
      }
      const brandKit = data.brand_kit as unknown as BrandIdentityResult["brand_kit"] | null;

      setGenerated({
        noms: brandNames || [],
        direction_artistique: artDirection || {
          palette: [],
          typographies: [],
          style_visuel: "",
          moodboard_description: "",
        },
        logo_concept: logoConcept || {
          description: "",
          forme: "",
          symbolisme: "",
          variations: [],
        },
        brand_kit: brandKit || {
          mission: "",
          vision: "",
          valeurs: [],
          ton: "",
          do_list: [],
          dont_list: [],
        },
      });
      setActiveTab("nom");
      toast.success("Identité de marque chargée depuis l'historique");
    } catch {
      toast.error("Erreur lors du chargement");
    }
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} />;
  }

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Identité de Marque"
          description="Crée ton identité de marque unique."
        />
        <AILoading text="Chargement" />
      </div>
    );
  }

  if (generating) {
    return (
      <div>
        <PageHeader
          title="Identité de Marque"
          description="Crée ton identité de marque unique."
        />
        <AILoading text="Génération de ton identité de marque" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Identité de Marque"
        description="Crée ton identité de marque unique."
        actions={
          generated ? (
            <Button variant="outline" onClick={() => setGenerated(null)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Nouveau brief
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeTab === tab.key
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "history" ? (
        <GenerationHistory
          table="brand_identities"
          titleField="selected_name"
          statusField="status"
          emptyMessage="Aucune identité de marque générée pour le moment."
          onSelect={handleHistorySelect}
        />
      ) : !generated ? (
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-accent" />
              Brief de marque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Brand direction */}
            <div className="space-y-2">
              <Label>Direction de marque</Label>
              <div className="flex flex-wrap gap-2">
                {BRAND_DIRECTIONS.map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setBrandDirection(dir)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                      brandDirection === dir
                        ? "border-accent bg-accent-muted text-accent"
                        : "border-border-default bg-bg-tertiary text-text-secondary hover:border-border-hover"
                    )}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <Label htmlFor="brand-industry">Industrie (optionnel)</Label>
              <Input
                id="brand-industry"
                placeholder="Ex : E-commerce, SaaS, Coaching..."
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>

            {/* Color preference */}
            <div className="space-y-2">
              <Label>Préférence de couleur</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PREFERENCES.map((color) => (
                  <button
                    key={color}
                    onClick={() => setColorPreference(color)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                      colorPreference === color
                        ? "border-accent bg-accent-muted text-accent"
                        : "border-border-default bg-bg-tertiary text-text-secondary hover:border-border-hover"
                    )}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <Button className="w-full" size="lg" onClick={handleGenerate} disabled={generating}>
              <Sparkles className="h-4 w-4 mr-2" />
              Générer mon identité de marque
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeTab === "nom" && (
            <NameGenerator
              brandId={brandId || undefined}
              names={generated.noms}
              selectedName={selectedName}
            />
          )}
          {activeTab === "direction" && (
            <StyleGuide direction={generated.direction_artistique} />
          )}
          {activeTab === "logo" && (
            <LogoGenerator
              concept={generated.logo_concept}
              brandName={selectedName || generated.noms?.[0]?.name}
              palette={generated.direction_artistique?.palette}
            />
          )}
          {activeTab === "kit" && (
            <BrandKitView kit={generated.brand_kit} />
          )}
        </>
      )}
    </div>
  );
}

// --- Brand Kit ---

function BrandKitView({
  kit,
}: {
  kit: BrandIdentityResult["brand_kit"] | null;
}) {
  if (!kit) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-text-muted mx-auto mb-3" />
        <p className="text-text-secondary">Aucun kit de marque généré.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mission & Vision */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">{kit.mission}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vision</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">{kit.vision}</p>
          </CardContent>
        </Card>
      </div>

      {/* Values */}
      <Card>
        <CardHeader>
          <CardTitle>Valeurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {kit.valeurs.map((v, i) => (
              <Badge key={i} variant="default">
                {typeof v === "string" ? v : JSON.stringify(v)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tone */}
      <Card>
        <CardHeader>
          <CardTitle>Ton de communication</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary">{kit.ton}</p>
        </CardContent>
      </Card>

      {/* Do / Don't */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4 text-accent" />
              À faire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {kit.do_list.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                <p className="text-sm text-text-secondary">{typeof item === "string" ? item : JSON.stringify(item)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <XCircle className="h-4 w-4 text-danger" />
              À ne pas faire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {kit.dont_list.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <XCircle className="h-3.5 w-3.5 text-danger mt-0.5 shrink-0" />
                <p className="text-sm text-text-secondary">{typeof item === "string" ? item : JSON.stringify(item)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
