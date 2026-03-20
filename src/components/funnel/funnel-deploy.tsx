"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Globe,
  ExternalLink,
  Copy,
  Rocket,
  CheckCircle,
  AlertCircle,
  FileDown,
  Shield,
  Smartphone,
  Zap,
  Loader2,
  RefreshCw,
  Share2,
  ArrowLeft,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { exportFunnelToHTML, downloadHTML } from "@/lib/utils/export-html";

/* ── Types ── */

interface PublishedFunnel {
  id: string;
  funnel_name: string;
  published: boolean;
  published_slug: string | null;
  published_at: string | null;
  custom_domain: string | null;
  status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  optin_page: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vsl_page: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  thankyou_page: any;
}

type WizardStep = 1 | 2 | 3 | 4;
type DomainOption = "subdomain" | "custom";

interface DeployState {
  step: WizardStep;
  domainOption: DomainOption;
  slugInput: string;
  customDomainInput: string;
  deploymentId: string | null;
  deployedUrl: string | null;
  customDomainDeployed: string | null;
  deployStatus: "pending" | "active" | "error";
  dnsVerified: boolean;
  checkingDns: boolean;
  pollingCount: number;
}

const DEPLOY_STAGES_SUBDOMAIN = ["Validation", "Publication", "En ligne"];
const DEPLOY_STAGES_CUSTOM = ["Validation", "Publication", "Domaine", "SSL", "En ligne"];
const MAX_POLLS = 20; // 20 × 30s = 10 minutes

/* ── Helpers ── */

function getAppDomain(): string {
  if (typeof window !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_APP_DOMAIN ||
      window.location.hostname.split(".").slice(-2).join(".") ||
      "scalingflow.io"
    );
  }
  return process.env.NEXT_PUBLIC_APP_DOMAIN || "scalingflow.io";
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ── Sub-components ── */

function PageCheckRow({
  label,
  present,
}: {
  label: string;
  present: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      {present ? (
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle className="h-4 w-4" />
          Prête
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-xs text-amber-400">
          <AlertCircle className="h-4 w-4" />
          Manquante
        </span>
      )}
    </div>
  );
}

function ProgressBar({
  stages,
  activeStage,
}: {
  stages: string[];
  activeStage: number;
}) {
  const pct = Math.round(((activeStage + 1) / stages.length) * 100);
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-text-muted">
        {stages.map((s, i) => (
          <span
            key={s}
            className={cn(
              "transition-colors",
              i <= activeStage ? "text-accent font-medium" : "text-text-muted",
            )}
          >
            {s}
          </span>
        ))}
      </div>
      <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

/* ── Live Card (already-published funnel) ── */

function LiveCard({
  funnel,
  appUrl,
  onModifyDomain,
  onUnpublish,
  onDownload,
}: {
  funnel: PublishedFunnel;
  appUrl: string;
  onModifyDomain: () => void;
  onUnpublish: () => void;
  onDownload: () => void;
}) {
  const publicUrl = `${appUrl}/f/${funnel.published_slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success("URL copiée !");
  };

  return (
    <Card className="border-accent/30">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-text-primary truncate">
                {funnel.funnel_name || "Funnel sans nom"}
              </h3>
              <Badge variant="cyan">
                <CheckCircle className="h-3 w-3 mr-1" />
                En ligne
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-bg-tertiary px-2 py-1 rounded text-accent truncate max-w-xs">
                {publicUrl}
              </code>
              <button
                onClick={copyUrl}
                className="text-text-muted hover:text-accent transition-colors shrink-0"
                title="Copier l'URL"
              >
                <Copy className="h-4 w-4" />
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-accent transition-colors shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            {funnel.published_at && (
              <p className="text-xs text-text-muted mt-1">
                Publié le{" "}
                {new Date(funnel.published_at).toLocaleDateString("fr-FR")}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={onDownload}>
              <FileDown className="h-4 w-4 mr-1" />
              HTML
            </Button>
            <Button variant="secondary" size="sm" onClick={onModifyDomain}>
              <Globe className="h-4 w-4 mr-1" />
              Domaine
            </Button>
            <Button variant="secondary" size="sm" onClick={onUnpublish}>
              Dépublier
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Deploy Wizard ── */

function DeployWizard({
  funnel,
  onClose,
  onDeployed,
}: {
  funnel: PublishedFunnel;
  onClose: () => void;
  onDeployed: () => void;
}) {
  const appDomain = getAppDomain();
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  const [state, setState] = useState<DeployState>({
    step: 1,
    domainOption: "subdomain",
    slugInput: slugify(funnel.funnel_name || "mon-funnel"),
    customDomainInput: "",
    deploymentId: null,
    deployedUrl: null,
    customDomainDeployed: null,
    deployStatus: "pending",
    dnsVerified: false,
    checkingDns: false,
    pollingCount: 0,
  });

  const [deploying, setDeploying] = useState(false);

  // DNS polling
  const checkDnsStatus = useCallback(
    async (deploymentId: string, isManual = false) => {
      if (isManual) setState((s) => ({ ...s, checkingDns: true }));

      try {
        const res = await fetch(
          `/api/funnel/domain-status?deployment_id=${deploymentId}`,
        );
        if (!res.ok) return;
        const data = await res.json();

        setState((s) => ({
          ...s,
          deployStatus: data.deploy_status,
          dnsVerified: data.dns_verified,
          checkingDns: false,
          pollingCount: s.pollingCount + 1,
        }));

        if (data.deploy_status === "active") {
          setState((s) => ({ ...s, step: 4 }));
          onDeployed();
        }
      } catch {
        if (isManual) setState((s) => ({ ...s, checkingDns: false }));
      }
    },
    [onDeployed],
  );

  useEffect(() => {
    if (
      state.step !== 3 ||
      !state.deploymentId ||
      !state.customDomainDeployed ||
      state.deployStatus === "active" ||
      state.pollingCount >= MAX_POLLS
    )
      return;

    const interval = setInterval(() => {
      checkDnsStatus(state.deploymentId!);
    }, 30000);

    return () => clearInterval(interval);
  }, [
    state.step,
    state.deploymentId,
    state.customDomainDeployed,
    state.deployStatus,
    state.pollingCount,
    checkDnsStatus,
  ]);

  // Pages completeness
  const hasOptin = !!(funnel.optin_page?.headline);
  const hasVsl = !!(funnel.vsl_page?.headline);
  const hasThankyou = !!(funnel.thankyou_page?.confirmation_message);
  const allPagesReady = hasOptin && hasVsl && hasThankyou;

  // Stage computation
  const stages =
    state.domainOption === "subdomain"
      ? DEPLOY_STAGES_SUBDOMAIN
      : DEPLOY_STAGES_CUSTOM;

  const activeStage = (() => {
    if (state.step < 3) return 0;
    if (state.step === 3) {
      if (state.domainOption === "subdomain") return 2; // En ligne
      if (state.dnsVerified) return 4; // En ligne
      if (state.deployStatus === "pending") return 2; // Domaine
      return 2;
    }
    return stages.length - 1;
  })();

  const handleDeploy = async () => {
    setDeploying(true);
    setState((s) => ({ ...s, step: 3 }));

    try {
      const body: Record<string, string> = {
        funnel_id: funnel.id,
        slug: state.slugInput,
      };
      if (state.domainOption === "custom" && state.customDomainInput) {
        body.custom_domain = state.customDomainInput.trim().toLowerCase();
      }

      const res = await fetch("/api/funnel/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors du déploiement");
        setState((s) => ({ ...s, step: 2 }));
        return;
      }

      setState((s) => ({
        ...s,
        deploymentId: data.deployment_id,
        deployedUrl: data.url,
        customDomainDeployed: data.custom_domain || null,
        deployStatus: data.deploy_status,
      }));

      // Subdomain-only: go directly to step 4
      if (!data.custom_domain || data.deploy_status === "active") {
        setState((s) => ({ ...s, step: 4 }));
        onDeployed();
      }
      // Custom domain: stay on step 3, polling starts via useEffect
    } catch {
      toast.error("Erreur réseau lors du déploiement");
      setState((s) => ({ ...s, step: 2 }));
    } finally {
      setDeploying(false);
    }
  };

  const shareUrl = async () => {
    const url = state.deployedUrl || `${appUrl}/f/${funnel.published_slug}`;
    if (navigator.share) {
      await navigator.share({ title: funnel.funnel_name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("URL copiée !");
    }
  };

  const copyFinalUrl = () => {
    const url = state.deployedUrl || `${appUrl}/f/${funnel.published_slug}`;
    navigator.clipboard.writeText(url);
    toast.success("URL copiée !");
  };

  const finalUrl = state.deployedUrl || `${appUrl}/f/${funnel.published_slug}`;

  return (
    <Card className="border-accent/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Rocket className="h-5 w-5 text-accent" />
            {funnel.funnel_name || "Funnel sans nom"}
          </CardTitle>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-xs"
          >
            Annuler
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                n < state.step
                  ? "bg-accent"
                  : n === state.step
                    ? "bg-accent/60"
                    : "bg-bg-tertiary",
              )}
            />
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {/* ── Step 1: Preview check ── */}
          {state.step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-3"
            >
              <p className="text-sm text-text-secondary">
                Vérifions que ton funnel est complet avant de le publier.
              </p>
              <div className="rounded-lg border border-border bg-bg-tertiary px-4">
                <PageCheckRow label="Page Opt-in" present={hasOptin} />
                <PageCheckRow label="Page VSL (Vidéo de Vente)" present={hasVsl} />
                <PageCheckRow label="Page Merci" present={hasThankyou} />
              </div>
              {!allPagesReady && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300">
                    Complète d&apos;abord toutes les pages dans l&apos;onglet
                    &quot;Générer&quot; avant de publier.
                  </p>
                </div>
              )}
              <Button
                className="w-full"
                disabled={!allPagesReady}
                onClick={() => setState((s) => ({ ...s, step: 2 }))}
              >
                Continuer
              </Button>
            </motion.div>
          )}

          {/* ── Step 2: Domain choice ── */}
          {state.step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <p className="text-sm text-text-secondary">
                Choisis comment publier ton funnel.
              </p>

              {/* Option A: subdomain */}
              <button
                className={cn(
                  "w-full text-left rounded-lg border p-4 transition-colors",
                  state.domainOption === "subdomain"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50",
                )}
                onClick={() =>
                  setState((s) => ({ ...s, domainOption: "subdomain" }))
                }
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                      state.domainOption === "subdomain"
                        ? "border-accent"
                        : "border-text-muted",
                    )}
                  >
                    {state.domainOption === "subdomain" && (
                      <div className="h-2 w-2 rounded-full bg-accent" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-text-primary">
                    Sous-domaine gratuit
                  </span>
                  <Badge variant="cyan" className="text-xs">Recommandé</Badge>
                </div>
                <p className="text-xs text-text-muted ml-6">
                  Publie immédiatement sur{" "}
                  <span className="text-accent font-mono">
                    {state.slugInput || "mon-funnel"}.{appDomain}
                  </span>
                </p>
              </button>

              {/* Slug input */}
              {state.domainOption === "subdomain" && (
                <div className="space-y-1.5">
                  <label className="text-xs text-text-muted font-medium">
                    Personnalise l&apos;URL
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-primary px-3 py-2 focus-within:border-accent">
                    <span className="text-sm text-text-muted shrink-0 font-mono">
                      {appDomain}/
                    </span>
                    <input
                      type="text"
                      value={state.slugInput}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          slugInput: e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "-"),
                        }))
                      }
                      placeholder="mon-offre"
                      className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Option B: custom domain */}
              <button
                className={cn(
                  "w-full text-left rounded-lg border p-4 transition-colors",
                  state.domainOption === "custom"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50",
                )}
                onClick={() =>
                  setState((s) => ({ ...s, domainOption: "custom" }))
                }
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                      state.domainOption === "custom"
                        ? "border-accent"
                        : "border-text-muted",
                    )}
                  >
                    {state.domainOption === "custom" && (
                      <div className="h-2 w-2 rounded-full bg-accent" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-text-primary">
                    Domaine personnalisé
                  </span>
                </div>
                <p className="text-xs text-text-muted ml-6">
                  Utilise ton propre domaine (ex: offre.monsite.com)
                </p>
              </button>

              {state.domainOption === "custom" && (
                <div className="space-y-1.5">
                  <label className="text-xs text-text-muted font-medium">
                    Ton domaine
                  </label>
                  <input
                    type="text"
                    value={state.customDomainInput}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        customDomainInput: e.target.value.trim().toLowerCase(),
                      }))
                    }
                    placeholder="offre.monsite.com"
                    className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent font-mono"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setState((s) => ({ ...s, step: 1 }))}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Retour
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleDeploy}
                  disabled={
                    deploying ||
                    (state.domainOption === "custom" &&
                      !state.customDomainInput)
                  }
                >
                  {deploying ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Rocket className="h-4 w-4 mr-2" />
                  )}
                  Déployer
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Deploying / DNS pending ── */}
          {state.step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <ProgressBar stages={stages} activeStage={activeStage} />

              {deploying && (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-text-secondary">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  Déploiement en cours...
                </div>
              )}

              {/* DNS instructions for custom domain */}
              {!deploying && state.customDomainDeployed && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {state.dnsVerified ? (
                      <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                        <Wifi className="h-4 w-4" />
                        DNS vérifié
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm text-amber-400">
                        <WifiOff className="h-4 w-4" />
                        En attente de propagation DNS…
                      </span>
                    )}
                    <span className="text-xs text-text-muted ml-auto">
                      Vérif. {state.pollingCount}/{MAX_POLLS}
                    </span>
                  </div>

                  <div className="rounded-lg bg-bg-tertiary border border-border p-4 space-y-3">
                    <p className="text-xs text-text-secondary font-medium">
                      Ajoute cet enregistrement DNS chez ton registrar :
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="space-y-1">
                        <p className="text-text-muted">Type</p>
                        <p className="font-mono text-text-primary bg-bg-primary px-2 py-1 rounded">CNAME</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-text-muted">Nom</p>
                        <p className="font-mono text-text-primary bg-bg-primary px-2 py-1 rounded truncate">
                          {state.customDomainDeployed.split(".")[0]}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-text-muted">Valeur</p>
                        <div className="flex items-center gap-1">
                          <p className="font-mono text-accent bg-bg-primary px-2 py-1 rounded text-xs truncate">
                            cname.vercel-dns.com
                          </p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText("cname.vercel-dns.com");
                              toast.success("Copié !");
                            }}
                            className="text-text-muted hover:text-accent shrink-0"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-300">
                        La propagation DNS peut prendre jusqu&apos;à 48h. Le SSL
                        s&apos;active automatiquement ensuite.
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    disabled={state.checkingDns}
                    onClick={() => checkDnsStatus(state.deploymentId!, true)}
                  >
                    {state.checkingDns ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Vérifier DNS maintenant
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Step 4: Live ── */}
          {state.step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center gap-2 py-2">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <CheckCircle className="h-8 w-8 text-accent" />
                </motion.div>
                <div>
                  <p className="text-base font-semibold text-text-primary">
                    Ton funnel est en ligne !
                  </p>
                  <p className="text-xs text-text-muted">SSL actif · Responsive · Rapide</p>
                </div>
              </div>

              {/* URL */}
              <div className="flex items-center gap-2 rounded-lg bg-bg-tertiary border border-border px-3 py-2">
                <code className="flex-1 text-xs text-accent truncate font-mono">
                  {finalUrl}
                </code>
                <button
                  onClick={copyFinalUrl}
                  className="text-text-muted hover:text-accent shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <a
                  href={finalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-accent shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {/* QR Code */}
              <div className="flex justify-center py-2">
                <div className="p-3 bg-white rounded-xl">
                  <QRCodeSVG
                    value={finalUrl}
                    size={140}
                    bgColor="#ffffff"
                    fgColor="#0B0E11"
                    level="M"
                  />
                </div>
              </div>
              <p className="text-center text-xs text-text-muted">
                Scanner pour tester sur mobile
              </p>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={shareUrl} variant="secondary" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      step: 2,
                      deploymentId: null,
                      deployedUrl: null,
                      customDomainDeployed: null,
                      deployStatus: "pending",
                      dnsVerified: false,
                      pollingCount: 0,
                    }))
                  }
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Modifier domaine
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

/* ── Main Component ── */

export function FunnelDeploy() {
  const [funnels, setFunnels] = useState<PublishedFunnel[]>([]);
  const [loading, setLoading] = useState(false);
  const [deployingFunnelId, setDeployingFunnelId] = useState<string | null>(null);
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    if (!user) return;
    loadFunnels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadFunnels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("funnels")
      .select(
        "id, funnel_name, published, published_slug, published_at, custom_domain, status, optin_page, vsl_page, thankyou_page",
      )
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (error) console.error("[FunnelDeploy] loadFunnels error:", error);
    setFunnels((data as PublishedFunnel[]) || []);
    setLoading(false);
  };

  const handleUnpublish = async (funnelId: string) => {
    const { error } = await supabase
      .from("funnels")
      .update({ published: false, status: "draft" })
      .eq("id", funnelId);

    if (error) {
      toast.error("Erreur lors de la dépublication");
      return;
    }
    toast.success("Funnel dépublié");
    await loadFunnels();
  };

  const handleDownloadHTML = (funnel: PublishedFunnel) => {
    const funnelData = {
      optin_page: funnel.optin_page,
      vsl_page: funnel.vsl_page,
      thankyou_page: funnel.thankyou_page,
    };
    const html = exportFunnelToHTML(funnelData, funnel.funnel_name);
    downloadHTML(html, `${funnel.funnel_name || "funnel"}.html`);
    toast.success("HTML téléchargé !");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  if (funnels.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Globe className="mx-auto h-12 w-12 text-text-muted mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Aucun funnel à déployer
          </h3>
          <p className="text-text-secondary text-sm">
            Génère d&apos;abord un funnel dans l&apos;onglet &quot;Générer&quot;
            pour pouvoir le publier.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feature summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-accent" />
            Déploiement de Funnel
          </CardTitle>
          <CardDescription>
            Publie tes funnels en un clic et obtiens une URL partageable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { icon: Globe, label: "URL publique", desc: "Lien unique pour chaque funnel" },
              { icon: Shield, label: "SSL inclus", desc: "HTTPS automatique" },
              { icon: Smartphone, label: "Responsive", desc: "Optimisé mobile" },
              { icon: Zap, label: "Performance", desc: "Chargement rapide" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 rounded-lg bg-bg-tertiary p-3"
              >
                <item.icon className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {item.label}
                  </p>
                  <p className="text-xs text-text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Funnel list */}
      <div className="space-y-4">
        {funnels.map((funnel) => {
          const isPublished = funnel.published && funnel.published_slug;
          const isWizardOpen = deployingFunnelId === funnel.id;

          if (isWizardOpen) {
            return (
              <DeployWizard
                key={funnel.id}
                funnel={funnel}
                onClose={() => setDeployingFunnelId(null)}
                onDeployed={async () => {
                  await loadFunnels();
                }}
              />
            );
          }

          if (isPublished) {
            return (
              <LiveCard
                key={funnel.id}
                funnel={funnel}
                appUrl={appUrl}
                onModifyDomain={() => setDeployingFunnelId(funnel.id)}
                onUnpublish={() => handleUnpublish(funnel.id)}
                onDownload={() => handleDownloadHTML(funnel)}
              />
            );
          }

          // Draft funnel card
          return (
            <Card key={funnel.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-semibold text-text-primary truncate">
                      {funnel.funnel_name || "Funnel sans nom"}
                    </h3>
                    <Badge variant="muted">Brouillon</Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownloadHTML(funnel)}
                    >
                      <FileDown className="h-4 w-4 mr-1" />
                      HTML
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setDeployingFunnelId(funnel.id)}
                    >
                      <Rocket className="h-4 w-4 mr-1" />
                      Publier
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
