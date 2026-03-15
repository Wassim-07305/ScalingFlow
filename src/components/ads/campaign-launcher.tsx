"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import {
  Rocket,
  Loader2,
  Link2,
  Image,
  Eye,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Target,
  DollarSign,
  Calendar,
  Type,
  MousePointer,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────

interface Audience {
  id: string;
  name: string;
  audience_type: string;
  meta_audience_id: string | null;
  status: string;
}

type CampaignStatus = "draft" | "pending" | "active";

const OBJECTIVES = [
  {
    value: "OUTCOME_LEADS",
    label: "Conversions",
    description: "Optimise pour les leads et ventes",
    icon: Target,
  },
  {
    value: "OUTCOME_TRAFFIC",
    label: "Trafic",
    description: "Envoie du trafic vers ton site",
    icon: MousePointer,
  },
  {
    value: "OUTCOME_AWARENESS",
    label: "Notoriété",
    description: "Maximise la portée de ta marque",
    icon: Eye,
  },
];

const CTA_OPTIONS = [
  { value: "LEARN_MORE", label: "En savoir plus" },
  { value: "SIGN_UP", label: "S'inscrire" },
  { value: "SHOP_NOW", label: "Acheter maintenant" },
  { value: "BOOK_TRAVEL", label: "Réserver" },
  { value: "CONTACT_US", label: "Nous contacter" },
  { value: "DOWNLOAD", label: "Télécharger" },
  { value: "GET_OFFER", label: "Obtenir l'offre" },
  { value: "GET_QUOTE", label: "Demander un devis" },
  { value: "SUBSCRIBE", label: "S'abonner" },
  { value: "WATCH_MORE", label: "Voir plus" },
];

// ─── Component ──────────────────────────────────────────────

export function CampaignLauncher() {
  const { user } = useUser();
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [metaConnected, setMetaConnected] = useState<boolean | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>("draft");
  const [launchResult, setLaunchResult] = useState<{
    campaign_id?: string;
    message?: string;
  } | null>(null);

  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [objective, setObjective] = useState("OUTCOME_LEADS");
  const [dailyBudget, setDailyBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [audienceId, setAudienceId] = useState("");
  const [creativeText, setCreativeText] = useState("");
  const [creativeHeadline, setCreativeHeadline] = useState("");
  const [creativeImageUrl, setCreativeImageUrl] = useState("");
  const [creativeCta, setCreativeCta] = useState("LEARN_MORE");
  const [landingPageUrl, setLandingPageUrl] = useState("");

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
      setMetaConnected(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAudiences();
  }, [fetchAudiences]);

  // ─── Launch Campaign ────────────────────────────────────────

  const handleLaunch = async () => {
    setShowConfirm(false);
    setLaunching(true);
    setCampaignStatus("pending");

    try {
      const selectedAudience = audiences.find((a) => a.id === audienceId);

      const res = await fetch("/api/integrations/meta/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_name: campaignName,
          objective,
          daily_budget: parseFloat(dailyBudget),
          audience_id: selectedAudience?.meta_audience_id || undefined,
          creative_text: creativeText,
          creative_headline: creativeHeadline,
          creative_image_url: creativeImageUrl,
          creative_cta: creativeCta,
          landing_page_url: landingPageUrl,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "META_NOT_CONNECTED") {
          setMetaConnected(false);
        }
        toast.error(data.error || "Erreur lors du lancement");
        setCampaignStatus("draft");
        return;
      }

      setCampaignStatus("active");
      setLaunchResult({
        campaign_id: data.meta?.campaign_id,
        message: data.message,
      });
      toast.success("Campagne créée avec succès !");
    } catch {
      toast.error("Erreur de connexion");
      setCampaignStatus("draft");
    } finally {
      setLaunching(false);
    }
  };

  const handleConfirmLaunch = () => {
    if (!campaignName.trim()) {
      toast.error("Donne un nom à ta campagne");
      return;
    }
    if (!dailyBudget || parseFloat(dailyBudget) <= 0) {
      toast.error("Définis un budget journalier valide");
      return;
    }
    if (!landingPageUrl.trim()) {
      toast.error("Ajoute l'URL de ta page de destination");
      return;
    }
    setShowConfirm(true);
  };

  const resetForm = () => {
    setCampaignName("");
    setObjective("OUTCOME_LEADS");
    setDailyBudget("");
    setStartDate("");
    setEndDate("");
    setAudienceId("");
    setCreativeText("");
    setCreativeHeadline("");
    setCreativeImageUrl("");
    setCreativeCta("LEARN_MORE");
    setLandingPageUrl("");
    setCampaignStatus("draft");
    setLaunchResult(null);
  };

  // ─── Meta Not Connected ────────────────────────────────────

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
              Pour lancer des campagnes automatiquement sans passer par Ads
              Manager, connecte ton compte Meta Ads. Tu pourras créer et
              déployer tes campagnes en quelques clics.
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  // ─── Launch Success ─────────────────────────────────────────

  if (campaignStatus === "active" && launchResult) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-2xl bg-emerald-500/10 mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Campagne lancée !
            </h3>
            <p className="text-sm text-text-secondary max-w-md mb-2">
              {launchResult.message}
            </p>
            {launchResult.campaign_id && (
              <p className="text-xs text-text-muted mb-6">
                ID Campagne : {launchResult.campaign_id}
              </p>
            )}
            <div className="flex gap-3">
              <Button onClick={resetForm}>
                <Rocket className="h-4 w-4 mr-2" />
                Lancer une autre campagne
              </Button>
              <Button variant="secondary" asChild>
                <a
                  href="https://business.facebook.com/adsmanager"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Voir dans Ads Manager
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Render Form ───────────────────────────────────────────

  const selectedObjective = OBJECTIVES.find((o) => o.value === objective);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Campaign Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-accent" />
                Configuration de la campagne
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nom de la campagne</Label>
                <Input
                  placeholder="Ex: Acquisition Q1 — Coaching"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Objectif</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {OBJECTIVES.map((obj) => (
                    <button
                      key={obj.value}
                      onClick={() => setObjective(obj.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-colors",
                        objective === obj.value
                          ? "bg-accent/10 border-accent text-text-primary"
                          : "bg-bg-tertiary border-border-default text-text-secondary hover:border-border-hover"
                      )}
                    >
                      <obj.icon
                        className={cn(
                          "h-5 w-5",
                          objective === obj.value
                            ? "text-accent"
                            : "text-text-muted"
                        )}
                      />
                      <span className="text-sm font-medium">{obj.label}</span>
                      <span className="text-[10px] text-text-muted">
                        {obj.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-text-muted" />
                    Budget journalier (EUR)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    placeholder="20"
                    value={dailyBudget}
                    onChange={(e) => setDailyBudget(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-text-muted" />
                    Audience
                  </Label>
                  <Select value={audienceId} onValueChange={setAudienceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Audience par défaut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_default">
                        Par défaut (FR, 25-55 ans)
                      </SelectItem>
                      {audiences
                        .filter(
                          (a) =>
                            a.status === "ready" || a.status === "targeting"
                        )
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-text-muted" />
                    Date de début
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-text-muted" />
                    Date de fin (optionnel)
                  </Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Creative */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5 text-accent" />
                Créative publicitaire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Texte de la publicité</Label>
                <Textarea
                  placeholder="Écris le texte principal de ta pub... Tu peux utiliser le générateur de créatives pour t'inspirer."
                  value={creativeText}
                  onChange={(e) => setCreativeText(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Titre (headline)</Label>
                <Input
                  placeholder="Ex: Transforme ton business en 90 jours"
                  value={creativeHeadline}
                  onChange={(e) => setCreativeHeadline(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Image className="h-3.5 w-3.5 text-text-muted" />
                    URL de l&apos;image
                  </Label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={creativeImageUrl}
                    onChange={(e) => setCreativeImageUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bouton d&apos;action (CTA)</Label>
                  <Select value={creativeCta} onValueChange={setCreativeCta}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CTA_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5 text-text-muted" />
                  URL de destination (landing page)
                </Label>
                <Input
                  type="url"
                  placeholder="https://ton-site.com/offre"
                  value={landingPageUrl}
                  onChange={(e) => setLandingPageUrl(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Launch Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleConfirmLaunch}
            disabled={launching}
          >
            {launching ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Rocket className="h-4 w-4 mr-2" />
            )}
            {launching ? "Lancement en cours..." : "Lancer la campagne"}
          </Button>

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-6">
            {(["draft", "pending", "active"] as CampaignStatus[]).map(
              (status) => {
                const isActive = campaignStatus === status;
                const isPast =
                  (status === "draft" && campaignStatus !== "draft") ||
                  (status === "pending" && campaignStatus === "active");

                return (
                  <div key={status} className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        isActive
                          ? "bg-accent animate-pulse"
                          : isPast
                            ? "bg-accent"
                            : "bg-bg-tertiary"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs",
                        isActive
                          ? "text-text-primary font-medium"
                          : "text-text-muted"
                      )}
                    >
                      {status === "draft"
                        ? "Brouillon"
                        : status === "pending"
                          ? "En attente"
                          : "Active"}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-2">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-accent" />
                Aperçu de la publicité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border-default bg-bg-tertiary overflow-hidden">
                {/* Mock Facebook ad */}
                <div className="p-3 border-b border-border-default">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-accent">SF</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">
                        Ta Page
                      </p>
                      <p className="text-[10px] text-text-muted">
                        Sponsorisé
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ad text */}
                <div className="p-3">
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                    {creativeText || (
                      <span className="text-text-muted italic">
                        Le texte de ta publicité apparaîtra ici...
                      </span>
                    )}
                  </p>
                </div>

                {/* Image */}
                <div className="aspect-video bg-bg-secondary flex items-center justify-center border-y border-border-default">
                  {creativeImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={creativeImageUrl}
                      alt="Aperçu"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="text-center">
                      <Image className="h-8 w-8 text-text-muted/30 mx-auto mb-1" />
                      <p className="text-[10px] text-text-muted">
                        Image de la publicité
                      </p>
                    </div>
                  )}
                </div>

                {/* Headline + CTA */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-muted truncate">
                      {landingPageUrl || "ton-site.com"}
                    </p>
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {creativeHeadline || "Titre de ta publicité"}
                    </p>
                  </div>
                  <div className="ml-3 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-semibold whitespace-nowrap">
                    {CTA_OPTIONS.find((o) => o.value === creativeCta)?.label ||
                      "En savoir plus"}
                  </div>
                </div>
              </div>

              {/* Campaign summary */}
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Résumé
                </h4>
                <div className="space-y-1.5">
                  {[
                    {
                      label: "Objectif",
                      value: selectedObjective?.label || "—",
                    },
                    {
                      label: "Budget",
                      value: dailyBudget
                        ? `${dailyBudget} EUR/jour`
                        : "—",
                    },
                    {
                      label: "Audience",
                      value:
                        audiences.find((a) => a.id === audienceId)?.name ||
                        "Par défaut",
                    },
                    {
                      label: "Début",
                      value: startDate
                        ? new Date(startDate).toLocaleDateString("fr-FR")
                        : "Immédiat",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-text-muted">{item.label}</span>
                      <span className="text-text-secondary font-medium">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {dailyBudget && (
                  <div className="mt-3 p-2.5 rounded-lg bg-accent/5 border border-accent/20">
                    <p className="text-[10px] text-text-muted mb-0.5">
                      Estimation mensuelle
                    </p>
                    <p className="text-sm font-bold text-accent">
                      {(parseFloat(dailyBudget) * 30).toFixed(0)} EUR/mois
                    </p>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="mt-4 flex items-start gap-2 p-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-text-muted">
                  La campagne sera créée en mode PAUSE. Tu pourras l&apos;activer
                  depuis l&apos;onglet Campagnes ou Meta Ads Manager.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Confirmation Dialog ──────────────────────────────── */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le lancement</DialogTitle>
            <DialogDescription>
              Tu es sur le point de créer une campagne Meta Ads. Vérifie les
              détails avant de confirmer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-text-muted">Campagne</div>
              <div className="text-text-primary font-medium">
                {campaignName}
              </div>
              <div className="text-text-muted">Objectif</div>
              <div className="text-text-primary">
                {selectedObjective?.label}
              </div>
              <div className="text-text-muted">Budget</div>
              <div className="text-text-primary">{dailyBudget} EUR/jour</div>
              <div className="text-text-muted">Audience</div>
              <div className="text-text-primary">
                {audiences.find((a) => a.id === audienceId)?.name ||
                  "Par défaut"}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20">
              <CheckCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <p className="text-xs text-text-secondary">
                La campagne sera créée en mode <strong>PAUSE</strong>. Tu gardes
                le contrôle total — aucune dépense ne sera engagée tant que tu
                ne l&apos;actives pas.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>
              Annuler
            </Button>
            <Button onClick={handleLaunch} disabled={launching}>
              {launching ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Rocket className="h-4 w-4 mr-2" />
              )}
              Confirmer et lancer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
