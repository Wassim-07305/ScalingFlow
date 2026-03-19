"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import {
  Palette,
  Globe,
  FileText,
  Download,
  Eye,
  Copy,
  CheckCircle2,
  Loader2,
  BarChart3,
  Users,
  Layers,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

// ─── F79 Whitelabel complet ──────────────────────────────────
// Dashboard, rapports, funnel sous la marque de l'élève

interface WhitelabelConfig {
  brand_name: string;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
  custom_domain: string | null;
  favicon_url: string | null;
  email_from_name: string;
  report_header: string;
  report_footer: string;
}

interface WhitelabelReport {
  id: string;
  title: string;
  type: "weekly" | "monthly" | "campaign";
  created_at: string;
  data: Record<string, unknown>;
}

const DEFAULT_CONFIG: WhitelabelConfig = {
  brand_name: "",
  primary_color: "#34D399",
  accent_color: "#10B981",
  logo_url: null,
  custom_domain: null,
  favicon_url: null,
  email_from_name: "",
  report_header: "",
  report_footer: "",
};

export function WhitelabelPortal({ className }: { className?: string }) {
  const { user, profile } = useUser();
  const supabase = useMemo(() => createClient(), []);
  const [config, setConfig] = useState<WhitelabelConfig>(DEFAULT_CONFIG);
  const [reports, setReports] = useState<WhitelabelReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "branding" | "reports" | "embed"
  >("branding");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      // Charger la config whitelabel
      const { data: wlConfig } = await supabase
        .from("whitelabel_config")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (wlConfig) {
        setConfig({
          brand_name: (wlConfig.brand_name as string) || "",
          primary_color: (wlConfig.primary_color as string) || "#34D399",
          accent_color: (wlConfig.accent_color as string) || "#10B981",
          logo_url: (wlConfig.logo_url as string) || null,
          custom_domain: (wlConfig.custom_domain as string) || null,
          favicon_url: (wlConfig.favicon_url as string) || null,
          email_from_name: (wlConfig.email_from_name as string) || "",
          report_header: (wlConfig.report_header as string) || "",
          report_footer: (wlConfig.report_footer as string) || "",
        });
      }

      // Charger les rapports
      const { data: reps } = await supabase
        .from("whitelabel_reports")
        .select("id, title, type, created_at, data")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setReports((reps ?? []) as unknown as WhitelabelReport[]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    await supabase.from("whitelabel_config").upsert(
      {
        user_id: user.id,
        ...config,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    setSaving(false);
    toast.success("Configuration whitelabel sauvegardée");
  };

  const handleGenerateReport = async (type: "weekly" | "monthly") => {
    if (!user) return;

    try {
      const res = await fetch("/api/whitelabel/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, config }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(
          `Rapport ${type === "weekly" ? "hebdomadaire" : "mensuel"} généré`,
        );
        if (data.report) {
          setReports((prev) => [data.report, ...prev]);
        }
      }
    } catch {
      toast.error("Erreur lors de la génération du rapport");
    }
  };

  const handleCopyEmbed = () => {
    const embedCode = `<!-- ScalingFlow Dashboard Embed -->
<iframe
  src="${process.env.NEXT_PUBLIC_APP_URL || "https://app.scalingflow.com"}/embed/dashboard?token=YOUR_TOKEN&brand=${encodeURIComponent(config.brand_name)}&color=${encodeURIComponent(config.primary_color)}"
  width="100%"
  height="800"
  frameborder="0"
  style="border-radius: 12px; border: 1px solid #1C1F23;"
></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast.success("Code d'embed copié !");
  };

  const sections = [
    { key: "branding" as const, label: "Branding", icon: Palette },
    { key: "reports" as const, label: "Rapports", icon: FileText },
    { key: "embed" as const, label: "Embed", icon: Globe },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Section tabs */}
      <div className="flex items-center gap-2 border-b border-border-default pb-3">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Button
              key={s.key}
              variant={activeSection === s.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveSection(s.key)}
            >
              <Icon className="h-4 w-4 mr-1" />
              {s.label}
            </Button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
        </div>
      ) : (
        <>
          {/* ─── Branding Section ──────────────────── */}
          {activeSection === "branding" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="h-4 w-4 text-accent" />
                    Personnalisation de marque
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nom de marque</Label>
                      <Input
                        value={config.brand_name}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            brand_name: e.target.value,
                          }))
                        }
                        placeholder={profile?.full_name || "Ta marque"}
                      />
                    </div>
                    <div>
                      <Label>Expéditeur emails</Label>
                      <Input
                        value={config.email_from_name}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            email_from_name: e.target.value,
                          }))
                        }
                        placeholder="John de [Ta Marque]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Couleur principale</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.primary_color}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              primary_color: e.target.value,
                            }))
                          }
                          className="h-10 w-14 rounded-lg border border-border-default cursor-pointer"
                        />
                        <Input
                          value={config.primary_color}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              primary_color: e.target.value,
                            }))
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Couleur accent</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.accent_color}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              accent_color: e.target.value,
                            }))
                          }
                          className="h-10 w-14 rounded-lg border border-border-default cursor-pointer"
                        />
                        <Input
                          value={config.accent_color}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              accent_color: e.target.value,
                            }))
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Domaine personnalisé</Label>
                    <Input
                      value={config.custom_domain || ""}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          custom_domain: e.target.value,
                        }))
                      }
                      placeholder="app.tamarque.com"
                    />
                    <p className="text-xs text-text-muted mt-1">
                      Configure un CNAME vers app.scalingflow.com
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>En-tête rapports</Label>
                      <Input
                        value={config.report_header}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            report_header: e.target.value,
                          }))
                        }
                        placeholder="Rapport de performance — [Ta Marque]"
                      />
                    </div>
                    <div>
                      <Label>Pied de page rapports</Label>
                      <Input
                        value={config.report_footer}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            report_footer: e.target.value,
                          }))
                        }
                        placeholder="© 2026 Ta Marque. Tous droits réservés."
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="p-4 rounded-xl border border-border-default">
                    <p className="text-xs text-text-muted mb-2">Aperçu</p>
                    <div
                      className="p-4 rounded-lg"
                      style={{
                        backgroundColor: config.primary_color + "15",
                        borderLeft: `4px solid ${config.primary_color}`,
                      }}
                    >
                      <h3
                        className="font-semibold"
                        style={{ color: config.primary_color }}
                      >
                        {config.brand_name || "Ta Marque"}
                      </h3>
                      <p className="text-sm text-text-secondary mt-1">
                        Dashboard de performance client
                      </p>
                      <Button
                        size="sm"
                        className="mt-2"
                        style={{ backgroundColor: config.accent_color }}
                      >
                        Voir le rapport
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                    )}
                    Sauvegarder la configuration
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Reports Section ───────────────────── */}
          {activeSection === "reports" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button onClick={() => handleGenerateReport("weekly")}>
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Rapport hebdomadaire
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleGenerateReport("monthly")}
                >
                  <Layers className="h-4 w-4 mr-1" />
                  Rapport mensuel
                </Button>
              </div>

              {reports.length > 0 ? (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <Card key={report.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-accent" />
                            <div>
                              <span className="text-sm font-medium text-text-primary">
                                {report.title}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="muted" className="text-[10px]">
                                  {report.type === "weekly"
                                    ? "Hebdomadaire"
                                    : report.type === "monthly"
                                      ? "Mensuel"
                                      : "Campagne"}
                                </Badge>
                                <span className="text-xs text-text-muted">
                                  {new Date(
                                    report.created_at,
                                  ).toLocaleDateString("fr-FR")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" title="Voir">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Télécharger"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="py-12">
                  <CardContent className="flex flex-col items-center text-center">
                    <FileText className="h-8 w-8 text-text-muted mb-3" />
                    <p className="text-sm text-text-secondary">
                      Aucun rapport généré. Crée ton premier rapport whitelabel.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ─── Embed Section ─────────────────────── */}
          {activeSection === "embed" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4 text-accent" />
                    Dashboard client embedable
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-text-secondary">
                    Intègre un dashboard de performance sous ta marque
                    directement sur ton site ou portail client. Tes clients
                    voient leurs métriques sans voir ScalingFlow.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card className="p-4 text-center">
                      <BarChart3 className="h-6 w-6 text-accent mx-auto mb-2" />
                      <span className="text-sm font-medium text-text-primary">
                        Dashboard métriques
                      </span>
                      <p className="text-xs text-text-muted mt-1">
                        KPIs, graphiques, tendances
                      </p>
                    </Card>
                    <Card className="p-4 text-center">
                      <Layers className="h-6 w-6 text-accent mx-auto mb-2" />
                      <span className="text-sm font-medium text-text-primary">
                        Funnel branded
                      </span>
                      <p className="text-xs text-text-muted mt-1">
                        Pages sous ton domaine
                      </p>
                    </Card>
                    <Card className="p-4 text-center">
                      <Users className="h-6 w-6 text-accent mx-auto mb-2" />
                      <span className="text-sm font-medium text-text-primary">
                        Portail client
                      </span>
                      <p className="text-xs text-text-muted mt-1">
                        Accès restreint par client
                      </p>
                    </Card>
                  </div>

                  <div className="p-4 rounded-xl bg-bg-tertiary border border-border-default">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">
                        Code d&apos;intégration
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyEmbed}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copier
                      </Button>
                    </div>
                    <pre className="text-xs text-text-muted bg-bg-primary p-3 rounded-lg overflow-x-auto">
                      {`<iframe
  src="${config.custom_domain || "app.scalingflow.com"}/embed/dashboard"
  width="100%" height="800"
  style="border-radius: 12px;"
></iframe>`}
                    </pre>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() =>
                      window.open("/embed/dashboard-preview", "_blank")
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Prévisualiser le dashboard client
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
