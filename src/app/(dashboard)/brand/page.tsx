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
  Target,
} from "lucide-react";
import { toast } from "sonner";
import type { BrandIdentityResult } from "@/lib/ai/prompts/brand-identity";

const TABS = [
  { key: "nom", label: "Nom", icon: Type },
  { key: "direction", label: "Direction Artistique", icon: Palette },
  { key: "logo", label: "Logo", icon: Hexagon },
  { key: "kit", label: "Kit de Marque", icon: BookOpen },
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
  const supabase = createClient();

  // Fetch existing brand identity
  React.useEffect(() => {
    if (!user) return;

    const fetchBrand = async () => {
      setLoading(true);

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
        const logoConcept = brand.logo_concept
          ? (typeof brand.logo_concept === "string"
              ? JSON.parse(brand.logo_concept)
              : brand.logo_concept) as BrandIdentityResult["logo_concept"]
          : null;
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
      if (!offerId) {
        const { data: offers } = await supabase
          .from("offers")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (offers && offers.length > 0) {
          setOfferId(offers[0].id);
        }
      }

      setLoading(false);
    };

    fetchBrand();
  }, [user, supabase, offerId]);

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      const response = await fetch("/api/ai/generate-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erreur lors de la generation");
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
      {!generated ? (
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
            <LogoConceptView concept={generated.logo_concept} />
          )}
          {activeTab === "kit" && (
            <BrandKitView kit={generated.brand_kit} />
          )}
        </>
      )}
    </div>
  );
}

// --- Logo Concept ---

function LogoConceptView({
  concept,
}: {
  concept: BrandIdentityResult["logo_concept"] | null;
}) {
  if (!concept) {
    return (
      <div className="text-center py-12">
        <Hexagon className="h-12 w-12 text-text-muted mx-auto mb-3" />
        <p className="text-text-secondary">Aucun concept de logo genere.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hexagon className="h-5 w-5 text-accent" />
            Concept de Logo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
              Description
            </p>
            <p className="text-sm text-text-secondary">{concept.description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-xl bg-bg-tertiary border border-border-default">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Forme</p>
              <p className="text-sm text-text-primary">{concept.forme}</p>
            </div>
            <div className="p-4 rounded-xl bg-bg-tertiary border border-border-default">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                Symbolisme
              </p>
              <p className="text-sm text-text-primary">{concept.symbolisme}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {concept.variations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Variations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {concept.variations.map((v, i) => (
                <Badge key={i} variant="muted">
                  {v}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
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
                {v}
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
                <p className="text-sm text-text-secondary">{item}</p>
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
                <p className="text-sm text-text-secondary">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
