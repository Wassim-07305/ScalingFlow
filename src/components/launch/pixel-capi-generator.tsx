"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import {
  Copy,
  Check,
  Code2,
  Server,
  Globe,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
interface PixelConfig {
  pixelId: string;
  accessToken: string;
  domain: string;
}

type EventType =
  | "PageView"
  | "Lead"
  | "Purchase"
  | "ViewContent"
  | "InitiateCheckout"
  | "CompleteRegistration";

const EVENTS: { key: EventType; label: string; description: string }[] = [
  {
    key: "PageView",
    label: "PageView",
    description: "Toutes les pages du funnel",
  },
  { key: "Lead", label: "Lead", description: "Formulaire opt-in soumis" },
  { key: "Purchase", label: "Purchase", description: "Achat confirmé" },
  {
    key: "ViewContent",
    label: "ViewContent",
    description: "Page VSL / offre vue",
  },
  {
    key: "InitiateCheckout",
    label: "InitiateCheckout",
    description: "Page de paiement ouverte",
  },
  {
    key: "CompleteRegistration",
    label: "CompleteRegistration",
    description: "Inscription terminée",
  },
];

// ─── Code generators ────────────────────────────────────────

function generatePixelBaseCode(pixelId: string): string {
  return `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`;
}

function generatePixelEvent(event: EventType, params?: string): string {
  if (event === "Purchase") {
    return `fbq('track', 'Purchase', {value: MONTANT, currency: 'EUR'});`;
  }
  if (event === "Lead") {
    return `fbq('track', 'Lead');`;
  }
  return `fbq('track', '${event}'${params ? `, ${params}` : ""});`;
}

function generateCAPIEndpoint(pixelId: string, accessToken: string): string {
  return `// ─── API Route : app/api/meta/capi/route.ts ─────────────────
import { NextResponse } from "next/server";
import crypto from "crypto";

const PIXEL_ID = "${pixelId}";
const ACCESS_TOKEN = "${accessToken}";
const API_VERSION = "v19.0";

function hashSHA256(value: string): string {
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

export async function POST(request: Request) {
  const body = await request.json();
  const { eventName, email, value, currency, sourceUrl, clientIp, userAgent } = body;

  const eventData = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_source_url: sourceUrl,
        user_data: {
          em: email ? [hashSHA256(email)] : undefined,
          client_ip_address: clientIp,
          client_user_agent: userAgent,
        },
        custom_data: value
          ? { value: parseFloat(value), currency: currency || "EUR" }
          : undefined,
      },
    ],
  };

  const response = await fetch(
    \`https://graph.facebook.com/\${API_VERSION}/\${PIXEL_ID}/events?access_token=\${ACCESS_TOKEN}\`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    }
  );

  const result = await response.json();
  return NextResponse.json(result);
}`;
}

function generateCAPIClientCall(): string {
  return `// ─── Appel client (ex: après soumission formulaire) ────────
async function sendCAPIEvent(eventName: string, email?: string, value?: number) {
  await fetch("/api/meta/capi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      email,
      value,
      currency: "EUR",
      sourceUrl: window.location.href,
      clientIp: "", // rempli côté serveur si middleware
      userAgent: navigator.userAgent,
    }),
  });
}

// Exemples d'utilisation :
sendCAPIEvent("Lead", "prospect@email.com");
sendCAPIEvent("Purchase", "client@email.com", 997);`;
}

// ─── Copy helper ─────────────────────────────────────────────
function useCopyToClipboard() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Code copié !");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return { copiedKey, copy };
}

// ─── Main component ──────────────────────────────────────────
export function PixelCAPIGenerator() {
  const { user } = useUser();
  const supabase = createClient();

  const [config, setConfig] = useState<PixelConfig>({
    pixelId: "",
    accessToken: "",
    domain: "",
  });
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "pixel",
  );
  const [saving, setSaving] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savedConfig, setSavedConfig] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const { copiedKey, copy } = useCopyToClipboard();

  const isConfigured = config.pixelId.trim().length > 0;

  // ─── Load existing config from Supabase on mount ──────────
  const loadConfig = useCallback(async () => {
    if (!user) return;
    try {
      const { data: account } = await supabase
        .from("connected_accounts")
        .select("access_token, provider_account_id, metadata")
        .eq("user_id", user.id)
        .eq("provider", "meta")
        .maybeSingle();

      if (account) {
        const metadata = account.metadata as Record<string, string> | null;
        setConfig({
          pixelId: metadata?.pixel_id || account.provider_account_id || "",
          accessToken: account.access_token || "",
          domain: metadata?.domain || "",
        });
        setSavedConfig(true);
      }
    } catch (err) {
      console.error("Erreur chargement config pixel:", err);
    } finally {
      setLoadingConfig(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user) {
      loadConfig();
    } else {
      setLoadingConfig(false);
    }
  }, [user, loadConfig]);

  // ─── Save config to Supabase ──────────────────────────────
  const handleSave = async () => {
    if (!user) {
      toast.error("Tu dois être connecté pour sauvegarder.");
      return;
    }
    if (!config.pixelId.trim()) {
      toast.error("Le Pixel ID est requis.");
      return;
    }

    setSaving(true);
    try {
      // Upsert: check if a meta row already exists
      const { data: existing } = await supabase
        .from("connected_accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("provider", "meta")
        .maybeSingle();

      const metadata = {
        pixel_id: config.pixelId.trim(),
        domain: config.domain.trim(),
        installed_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase
          .from("connected_accounts")
          .update({
            provider_account_id: config.pixelId.trim(),
            access_token: config.accessToken.trim() || null,
            metadata,
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("connected_accounts").insert({
          user_id: user.id,
          provider: "meta",
          provider_account_id: config.pixelId.trim(),
          access_token: config.accessToken.trim() || null,
          metadata,
        });

        if (error) throw error;
      }

      setSavedConfig(true);
      toast.success("Configuration Pixel sauvegardée !");
    } catch (err) {
      console.error("Erreur sauvegarde config pixel:", err);
      toast.error("Erreur lors de la sauvegarde. Réessaie.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Test pixel via CAPI ──────────────────────────────────
  const handleTestPixel = async () => {
    if (!config.pixelId.trim() || !config.accessToken.trim()) {
      toast.error("Le Pixel ID et l'Access Token sont requis pour tester.");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/integrations/meta/conversions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: "ViewContent",
          sourceUrl: config.domain || window.location.href,
          contentName: "Test ScalingFlow Pixel",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `Événement ViewContent envoyé avec succès (${data.events_received || 1} événement reçu).`,
        });
        toast.success("Test Pixel réussi !");
      } else {
        setTestResult({
          success: false,
          message: data.error || "Erreur lors de l'envoi de l'événement test.",
        });
        toast.error("Échec du test Pixel.");
      }
    } catch (err) {
      console.error("Erreur test pixel:", err);
      setTestResult({
        success: false,
        message: "Erreur réseau. Vérifie ta connexion et réessaie.",
      });
      toast.error("Erreur réseau lors du test.");
    } finally {
      setTesting(false);
    }
  };

  const toggle = (key: string) =>
    setExpandedSection(expandedSection === key ? null : key);

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <span className="ml-2 text-sm text-text-secondary">
          Chargement de la configuration...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-accent" />
            Configuration Meta Pixel & CAPI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="pixel-id">Pixel ID</Label>
              <Input
                id="pixel-id"
                placeholder="123456789012345"
                value={config.pixelId}
                onChange={(e) => {
                  setConfig((p) => ({ ...p, pixelId: e.target.value }));
                  setSavedConfig(false);
                }}
              />
              <p className="text-xs text-text-muted mt-1">
                Trouvé dans Meta Events Manager
              </p>
            </div>
            <div>
              <Label htmlFor="access-token">Access Token (CAPI)</Label>
              <Input
                id="access-token"
                type="password"
                placeholder="EAABsb..."
                value={config.accessToken}
                onChange={(e) => {
                  setConfig((p) => ({ ...p, accessToken: e.target.value }));
                  setSavedConfig(false);
                }}
              />
              <p className="text-xs text-text-muted mt-1">
                Token généré dans Events Manager &rarr; Settings
              </p>
            </div>
            <div>
              <Label htmlFor="domain">Domaine du funnel</Label>
              <Input
                id="domain"
                placeholder="https://monoffre.com"
                value={config.domain}
                onChange={(e) => {
                  setConfig((p) => ({ ...p, domain: e.target.value }));
                  setSavedConfig(false);
                }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving || !config.pixelId.trim()}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : savedConfig ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving
                ? "Sauvegarde..."
                : savedConfig
                  ? "Sauvegardé"
                  : "Sauvegarder"}
            </Button>

            <Button
              variant="outline"
              onClick={handleTestPixel}
              disabled={
                testing || !config.pixelId.trim() || !config.accessToken.trim()
              }
              className="gap-2"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {testing ? "Test en cours..." : "Tester le Pixel"}
            </Button>
          </div>

          {/* Test result */}
          {testResult && (
            <div
              className={cn(
                "flex items-start gap-2 p-3 rounded-xl border",
                testResult.success
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-red-500/10 border-red-500/20",
              )}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <p
                className={cn(
                  "text-xs",
                  testResult.success ? "text-emerald-300" : "text-red-300",
                )}
              >
                {testResult.message}
              </p>
            </div>
          )}

          {!isConfigured && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
              <p className="text-xs text-yellow-300">
                Entre ton Pixel ID pour générer les snippets de code.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isConfigured && (
        <>
          {/* 1. Pixel Base Code */}
          <Card>
            <CardHeader
              className="cursor-pointer py-3"
              onClick={() => toggle("pixel")}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4 text-accent" />
                  1. Code Pixel de base
                  <Badge variant="default">head</Badge>
                </CardTitle>
                {expandedSection === "pixel" ? (
                  <ChevronUp className="h-4 w-4 text-text-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-muted" />
                )}
              </div>
            </CardHeader>
            {expandedSection === "pixel" && (
              <CardContent className="pt-0 space-y-3">
                <p className="text-xs text-text-secondary">
                  Colle ce code dans le{" "}
                  <code className="text-accent">&lt;head&gt;</code> de toutes
                  les pages de ton funnel.
                </p>
                <div className="relative">
                  <pre className="p-4 rounded-xl bg-bg-tertiary text-xs text-text-secondary overflow-x-auto max-h-64">
                    {generatePixelBaseCode(config.pixelId)}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() =>
                      copy("pixel-base", generatePixelBaseCode(config.pixelId))
                    }
                  >
                    {copiedKey === "pixel-base" ? (
                      <Check className="h-3.5 w-3.5 text-accent" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 2. Pixel Events */}
          <Card>
            <CardHeader
              className="cursor-pointer py-3"
              onClick={() => toggle("events")}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-accent" />
                  2. Événements Pixel
                </CardTitle>
                {expandedSection === "events" ? (
                  <ChevronUp className="h-4 w-4 text-text-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-muted" />
                )}
              </div>
            </CardHeader>
            {expandedSection === "events" && (
              <CardContent className="pt-0 space-y-3">
                <p className="text-xs text-text-secondary">
                  Ajoute ces événements aux actions correspondantes de ton
                  funnel.
                </p>
                <div className="grid gap-2">
                  {EVENTS.map((evt) => {
                    const code = generatePixelEvent(evt.key);
                    return (
                      <div
                        key={evt.key}
                        className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant="muted" className="text-[10px]">
                              {evt.label}
                            </Badge>
                            <span className="text-xs text-text-muted">
                              {evt.description}
                            </span>
                          </div>
                          <code className="text-xs text-accent">{code}</code>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copy(`evt-${evt.key}`, code)}
                        >
                          {copiedKey === `evt-${evt.key}` ? (
                            <Check className="h-3.5 w-3.5 text-accent" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>

          {/* 3. Conversions API (CAPI) */}
          <Card>
            <CardHeader
              className="cursor-pointer py-3"
              onClick={() => toggle("capi")}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server className="h-4 w-4 text-accent" />
                  3. Conversions API (CAPI)
                  <Badge variant="blue">Server-Side</Badge>
                </CardTitle>
                {expandedSection === "capi" ? (
                  <ChevronUp className="h-4 w-4 text-text-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-muted" />
                )}
              </div>
            </CardHeader>
            {expandedSection === "capi" && (
              <CardContent className="pt-0 space-y-4">
                <p className="text-xs text-text-secondary">
                  Le CAPI envoie les événements côté serveur pour un tracking
                  plus fiable (bypass ad blockers).
                  {!config.accessToken && (
                    <span className="text-yellow-400 ml-1">
                      Entre ton Access Token pour générer le code CAPI.
                    </span>
                  )}
                </p>

                {config.accessToken ? (
                  <>
                    <div>
                      <p className="text-xs font-medium text-text-primary mb-2">
                        API Route (Next.js)
                      </p>
                      <div className="relative">
                        <pre className="p-4 rounded-xl bg-bg-tertiary text-xs text-text-secondary overflow-x-auto max-h-80">
                          {generateCAPIEndpoint(
                            config.pixelId,
                            config.accessToken,
                          )}
                        </pre>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            copy(
                              "capi-route",
                              generateCAPIEndpoint(
                                config.pixelId,
                                config.accessToken,
                              ),
                            )
                          }
                        >
                          {copiedKey === "capi-route" ? (
                            <Check className="h-3.5 w-3.5 text-accent" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-text-primary mb-2">
                        Appel client
                      </p>
                      <div className="relative">
                        <pre className="p-4 rounded-xl bg-bg-tertiary text-xs text-text-secondary overflow-x-auto max-h-64">
                          {generateCAPIClientCall()}
                        </pre>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            copy("capi-client", generateCAPIClientCall())
                          }
                        >
                          {copiedKey === "capi-client" ? (
                            <Check className="h-3.5 w-3.5 text-accent" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center rounded-xl bg-bg-tertiary">
                    <Server className="h-8 w-8 text-text-muted mx-auto mb-2" />
                    <p className="text-sm text-text-secondary">
                      Configure ton Access Token ci-dessus pour générer le code
                      CAPI.
                    </p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Checklist */}
          <Card className="border-accent/20">
            <CardContent className="py-4">
              <h4 className="text-sm font-semibold text-text-primary mb-3">
                Checklist d&apos;installation
              </h4>
              <div className="space-y-2">
                {[
                  "Pixel de base installé dans le <head> de toutes les pages",
                  "Événement Lead sur la page de remerciement opt-in",
                  "Événement Purchase sur la page de confirmation d'achat",
                  "Événement ViewContent sur la page VSL / offre",
                  "API Route CAPI créée et déployée",
                  "Appels CAPI intégrés aux formulaires",
                  "Tester avec Meta Pixel Helper (extension Chrome)",
                  "Vérifier les événements dans Events Manager > Test Events",
                ].map((item, i) => (
                  <label
                    key={i}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-bg-tertiary/50 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded border-border-default accent-accent"
                    />
                    <span className="text-xs text-text-secondary">{item}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
