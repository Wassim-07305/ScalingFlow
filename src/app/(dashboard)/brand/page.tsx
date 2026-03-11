"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { NameGenerator } from "@/components/brand/name-generator";
import { StyleGuide } from "@/components/brand/style-guide";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import {
  Sparkles,
  Type,
  Palette,
  Hexagon,
  BookOpen,
  CheckCircle,
  XCircle,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { GenerationHistory } from "@/components/shared/generation-history";
import { LogoGenerator } from "@/components/brand/logo-generator";
import type { BrandIdentityResult } from "@/lib/ai/prompts/brand-identity";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

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
        body: JSON.stringify({ offerId }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 403 && errData.usage) { setUsageLimited(errData.usage); return; }
        throw new Error(errData.error || "Erreur lors de la generation");
      }

      const data = await response.json();
      setBrandId(data.id);
      setGenerated(data.generated);
      setSelectedName(null);
      toast.success("Identite de marque generee avec succes !");
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
          title="Identite de Marque"
          description="Cree ton identite de marque unique."
        />
        <AILoading text="Chargement" />
      </div>
    );
  }

  if (generating) {
    return (
      <div>
        <PageHeader
          title="Identite de Marque"
          description="Cree ton identite de marque unique."
        />
        <AILoading text="Generation de ton identite de marque" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Identite de Marque"
        description="Cree ton identite de marque unique."
        actions={
          <Button onClick={handleGenerate} disabled={generating}>
            <Sparkles className="h-4 w-4 mr-2" />
            {generated ? "Regenerer" : "Generer"}
          </Button>
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
        <EmptyState
          icon={Palette}
          title="Aucune identite de marque"
          description="Genere ton identite de marque pour obtenir des propositions de noms, une direction artistique, un concept de logo et un kit de marque complet."
          actionLabel="Generer mon identite"
          onAction={handleGenerate}
        />
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
        <p className="text-text-secondary">Aucun kit de marque genere.</p>
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
              A faire
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
              A ne pas faire
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
