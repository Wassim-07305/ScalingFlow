"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ShoppingBag,
  GitBranch,
  Globe,
  Palette,
  Code2,
  Link2,
  FileText,
  Users,
  ArrowRight,
  PartyPopper,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────
type CheckStatus = "pass" | "warn" | "fail" | "loading";

interface CheckItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  status: CheckStatus;
  detail?: string;
  fixLink?: string;
  fixLabel?: string;
}

// ─── Component ───────────────────────────────────────────────
export function PreLaunchChecklist() {
  const { user, profile } = useUser();
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [loading, setLoading] = useState(true);

  const runChecks = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const supabase = createClient();

    // Build all checks in parallel
    const [
      offersResult,
      funnelsResult,
      brandResult,
      contentResult,
      adsResult,
      campaignsResult,
      integrationsResult,
    ] = await Promise.all([
      // 1. Offre créée
      supabase
        .from("offers")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      // 2. Funnel configuré
      supabase
        .from("funnels")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      // 3. Brand identity
      supabase
        .from("brand_identities")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      // 4. Contenu prêt (content_pieces)
      supabase
        .from("content_pieces")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      // 5. Ads créatives
      supabase
        .from("ad_creatives")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      // 6. Campagnes (audience)
      supabase
        .from("ad_campaigns")
        .select("id, audience_config", { count: "exact" })
        .eq("user_id", user.id),
      // 7. Integrations status
      fetch("/api/integrations/status")
        .then((r) => r.json())
        .catch(() => ({ status: {} })),
    ]);

    const offersCount = offersResult.count ?? 0;
    const funnelsCount = funnelsResult.count ?? 0;
    const brandCount = brandResult.count ?? 0;
    const contentCount = contentResult.count ?? 0;
    const adsCount = adsResult.count ?? 0;
    const campaignsCount = campaignsResult.count ?? 0;

    // Check selected_market from profile
    const hasMarket = !!profile?.selected_market;

    // Check pixel config from profile
    const hasPixel = !!profile?.meta_access_token && !!profile?.meta_ad_account_id;

    // Check integrations
    const integrationStatus = integrationsResult?.status || {};
    const connectedCount = Object.values(integrationStatus).filter(
      (s: unknown) => (s as { connected: boolean })?.connected
    ).length;

    // Check audience config exists on any campaign
    const hasAudience =
      campaignsResult.data?.some(
        (c: { audience_config: unknown }) => c.audience_config !== null
      ) ?? false;

    const items: CheckItem[] = [
      {
        id: "offer",
        label: "Offre créée",
        description: "Au moins une offre doit être configurée dans le système.",
        icon: <ShoppingBag className="h-5 w-5" />,
        status: offersCount > 0 ? "pass" : "fail",
        detail:
          offersCount > 0
            ? `${offersCount} offre${offersCount > 1 ? "s" : ""} trouvée${offersCount > 1 ? "s" : ""}`
            : "Aucune offre créée",
        fixLink: "/offer",
        fixLabel: "Créer une offre",
      },
      {
        id: "funnel",
        label: "Funnel configuré",
        description: "Un funnel de vente doit être en place pour convertir les prospects.",
        icon: <GitBranch className="h-5 w-5" />,
        status: funnelsCount > 0 ? "pass" : "fail",
        detail:
          funnelsCount > 0
            ? `${funnelsCount} funnel${funnelsCount > 1 ? "s" : ""} configuré${funnelsCount > 1 ? "s" : ""}`
            : "Aucun funnel créé",
        fixLink: "/funnel",
        fixLabel: "Créer un funnel",
      },
      {
        id: "market",
        label: "Marché validé",
        description: "Un marché cible doit être sélectionné et validé.",
        icon: <Globe className="h-5 w-5" />,
        status: hasMarket ? "pass" : "fail",
        detail: hasMarket
          ? `Marché : ${profile?.selected_market}`
          : "Aucun marché sélectionné",
        fixLink: "/onboarding",
        fixLabel: "Sélectionner un marché",
      },
      {
        id: "brand",
        label: "Identité de marque",
        description: "Le branding (nom, couleurs, direction artistique) doit être défini.",
        icon: <Palette className="h-5 w-5" />,
        status: brandCount > 0 ? "pass" : "fail",
        detail:
          brandCount > 0
            ? `${brandCount} identité${brandCount > 1 ? "s" : ""} de marque`
            : "Aucune identité de marque",
        fixLink: "/brand",
        fixLabel: "Créer l'identité",
      },
      {
        id: "pixel",
        label: "Pixel & CAPI",
        description: "Le pixel Meta et le token CAPI doivent être configurés pour le tracking.",
        icon: <Code2 className="h-5 w-5" />,
        status: hasPixel ? "pass" : profile?.meta_ad_account_id ? "warn" : "fail",
        detail: hasPixel
          ? "Pixel et CAPI configurés"
          : profile?.meta_ad_account_id
            ? "Token CAPI manquant"
            : "Pixel non configuré",
        fixLink: "/launch",
        fixLabel: "Configurer le pixel",
      },
      {
        id: "integrations",
        label: "Intégrations connectées",
        description: "Au moins une intégration externe doit être connectée (Meta, Stripe, etc.).",
        icon: <Link2 className="h-5 w-5" />,
        status:
          connectedCount >= 2 ? "pass" : connectedCount === 1 ? "warn" : "fail",
        detail:
          connectedCount > 0
            ? `${connectedCount} intégration${connectedCount > 1 ? "s" : ""} connectée${connectedCount > 1 ? "s" : ""}`
            : "Aucune intégration connectée",
        fixLink: "/settings",
        fixLabel: "Connecter les intégrations",
      },
      {
        id: "content",
        label: "Contenu prêt",
        description: "Des créatives publicitaires ou du contenu doivent être générés.",
        icon: <FileText className="h-5 w-5" />,
        status:
          adsCount > 0 && contentCount > 0
            ? "pass"
            : adsCount > 0 || contentCount > 0
              ? "warn"
              : "fail",
        detail:
          adsCount > 0 || contentCount > 0
            ? `${adsCount} créative${adsCount > 1 ? "s" : ""} ads, ${contentCount} contenu${contentCount > 1 ? "s" : ""}`
            : "Aucun contenu généré",
        fixLink: "/ads",
        fixLabel: "Générer du contenu",
      },
      {
        id: "audience",
        label: "Audience configurée",
        description:
          "Au moins une campagne avec une audience cible définie.",
        icon: <Users className="h-5 w-5" />,
        status: hasAudience ? "pass" : campaignsCount > 0 ? "warn" : "fail",
        detail: hasAudience
          ? "Audience configurée sur les campagnes"
          : campaignsCount > 0
            ? "Campagnes créées mais audience non configurée"
            : "Aucune campagne créée",
        fixLink: "/ads",
        fixLabel: "Configurer l'audience",
      },
    ];

    setChecks(items);
    setLoading(false);
  }, [user, profile]);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const passedCount = checks.filter((c) => c.status === "pass").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const progressPct = checks.length > 0 ? Math.round((passedCount / checks.length) * 100) : 0;
  const allGreen = passedCount === 8 && checks.length === 8;

  // ─── Loading skeleton ────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="border-accent/20">
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 text-accent animate-spin" />
              <p className="text-sm text-text-secondary">
                Vérification en cours…
              </p>
            </div>
          </CardContent>
        </Card>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-bg-tertiary animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-bg-tertiary rounded animate-pulse" />
                  <div className="h-3 w-72 bg-bg-tertiary rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* All green banner */}
      {allGreen && (
        <Card className="border-accent/40 bg-accent/5">
          <CardContent className="py-6">
            <div className="flex flex-col items-center text-center gap-3">
              <PartyPopper className="h-10 w-10 text-accent" />
              <div>
                <h3 className="text-lg font-bold text-accent">
                  Tout est prêt !
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  Toutes les vérifications sont passées. Tu peux lancer tes
                  premières ads en toute confiance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress summary */}
      <Card className="border-accent/20">
        <CardContent className="py-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-text-primary">
                Checklist pré-lancement
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                {passedCount}/8 vérifications réussies
              </p>
            </div>
            <div className="flex items-center gap-2">
              {passedCount > 0 && (
                <Badge variant="default">{passedCount} OK</Badge>
              )}
              {warnCount > 0 && (
                <Badge variant="yellow">{warnCount} avertissement{warnCount > 1 ? "s" : ""}</Badge>
              )}
              {failCount > 0 && (
                <Badge variant="red">{failCount} manquant{failCount > 1 ? "s" : ""}</Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={runChecks}
                className="ml-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Progress value={progressPct} />
          <p className="text-xs text-text-muted mt-2 text-right">
            {progressPct}%
          </p>
        </CardContent>
      </Card>

      {/* Check items */}
      <div className="space-y-3">
        {checks.map((check) => (
          <Card
            key={check.id}
            className={cn(
              "transition-all",
              check.status === "pass" && "border-accent/20",
              check.status === "warn" && "border-yellow-500/20",
              check.status === "fail" && "border-red-500/20"
            )}
          >
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                {/* Status icon */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl shrink-0",
                    check.status === "pass" && "bg-accent/10 text-accent",
                    check.status === "warn" && "bg-yellow-500/10 text-yellow-400",
                    check.status === "fail" && "bg-red-500/10 text-red-400"
                  )}
                >
                  {check.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-text-primary">
                      {check.label}
                    </p>
                    {check.status === "pass" && (
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                    )}
                    {check.status === "warn" && (
                      <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
                    )}
                    {check.status === "fail" && (
                      <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-text-muted">{check.description}</p>
                  {check.detail && (
                    <p
                      className={cn(
                        "text-xs mt-1 font-medium",
                        check.status === "pass" && "text-accent",
                        check.status === "warn" && "text-yellow-400",
                        check.status === "fail" && "text-red-400"
                      )}
                    >
                      {check.detail}
                    </p>
                  )}
                </div>

                {/* Fix link */}
                {check.status !== "pass" && check.fixLink && (
                  <Link href={check.fixLink}>
                    <Button variant="ghost" size="sm" className="shrink-0 gap-1.5 text-xs">
                      {check.fixLabel}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
