"use client";

import { useState, useEffect } from "react";
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
import {
  Globe,
  ExternalLink,
  Copy,
  Rocket,
  CheckCircle,
  AlertCircle,
  FileDown,
  Code,
  Shield,
  Smartphone,
  Zap,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { exportFunnelToHTML, downloadHTML } from "@/lib/utils/export-html";

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

export function FunnelDeploy() {
  const [funnels, setFunnels] = useState<PublishedFunnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [slugInput, setSlugInput] = useState("");
  const [selectedFunnel, setSelectedFunnel] = useState<string | null>(null);
  const { user } = useUser();
  const supabase = createClient();

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

  const handlePublish = async (funnelId: string) => {
    setPublishing(funnelId);
    try {
      const slug = slugInput.trim() || undefined;
      const res = await fetch("/api/funnel/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ funnel_id: funnelId, slug }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la publication");
        return;
      }

      toast.success("Funnel publié avec succès !");
      setSlugInput("");
      setSelectedFunnel(null);
      await loadFunnels();
    } catch {
      toast.error("Erreur lors de la publication");
    } finally {
      setPublishing(null);
    }
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

  const copyUrl = (slug: string) => {
    const url = `${appUrl}/f/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("URL copiée !");
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
      {/* Deployment checklist */}
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
              {
                icon: Globe,
                label: "URL publique",
                desc: "Lien unique pour chaque funnel",
              },
              { icon: Shield, label: "SSL inclus", desc: "HTTPS automatique" },
              {
                icon: Smartphone,
                label: "Responsive",
                desc: "Optimisé mobile",
              },
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
          const publicUrl = isPublished
            ? `${appUrl}/f/${funnel.published_slug}`
            : null;
          const isSelected = selectedFunnel === funnel.id;

          return (
            <Card
              key={funnel.id}
              className={cn(isPublished && "border-accent/30")}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-text-primary truncate">
                        {funnel.funnel_name || "Funnel sans nom"}
                      </h3>
                      {isPublished ? (
                        <Badge variant="cyan">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          En ligne
                        </Badge>
                      ) : (
                        <Badge variant="muted">Brouillon</Badge>
                      )}
                    </div>

                    {publicUrl && (
                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-xs bg-bg-tertiary px-2 py-1 rounded text-accent truncate max-w-xs">
                          {publicUrl}
                        </code>
                        <button
                          onClick={() => copyUrl(funnel.published_slug!)}
                          className="text-text-muted hover:text-accent transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-muted hover:text-accent transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    )}

                    {funnel.published_at && (
                      <p className="text-xs text-text-muted mt-1">
                        Publié le{" "}
                        {new Date(funnel.published_at).toLocaleDateString(
                          "fr-FR",
                        )}
                      </p>
                    )}
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

                    {isPublished ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUnpublish(funnel.id)}
                      >
                        Dépublier
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          if (isSelected) {
                            handlePublish(funnel.id);
                          } else {
                            setSelectedFunnel(funnel.id);
                          }
                        }}
                        disabled={publishing === funnel.id}
                      >
                        {publishing === funnel.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Rocket className="h-4 w-4 mr-1" />
                        )}
                        Publier
                      </Button>
                    )}
                  </div>
                </div>

                {/* Slug input when selected */}
                {isSelected && !isPublished && (
                  <div className="mt-4 p-4 rounded-lg bg-bg-tertiary border border-border">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Personnalise l&apos;URL de ton funnel (optionnel)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-muted shrink-0">
                        {appUrl}/f/
                      </span>
                      <input
                        type="text"
                        value={slugInput}
                        onChange={(e) =>
                          setSlugInput(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, "-"),
                          )
                        }
                        placeholder="mon-offre"
                        className="flex-1 rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
                      />
                      <Button
                        size="sm"
                        onClick={() => handlePublish(funnel.id)}
                        disabled={publishing === funnel.id}
                      >
                        {publishing === funnel.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Confirmer"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom domain instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Code className="h-5 w-5 text-text-muted" />
            Domaine personnalisé
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-text-secondary">
            Pour utiliser ton propre domaine (ex: offre.tonsite.com) :
          </p>
          <ol className="text-sm text-text-secondary space-y-2 list-decimal pl-5">
            <li>
              Ajoute un enregistrement <strong>CNAME</strong> pointant vers{" "}
              <code className="bg-bg-tertiary px-1.5 py-0.5 rounded text-accent text-xs">
                cname.vercel-dns.com
              </code>
            </li>
            <li>Ajoute le domaine dans les paramètres de ton projet Vercel</li>
            <li>Le SSL sera automatiquement configuré par Vercel</li>
          </ol>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">
              La propagation DNS peut prendre jusqu&apos;à 48h. Le SSL est
              activé automatiquement une fois le domaine vérifié.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
