"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  XCircle,
  Circle,
  AlertTriangle,
  Save,
  FlaskConical,
} from "lucide-react";

// ─── Définition des services ───────────────────────────────────────────────

interface KeyDef {
  key: string;
  label: string;
  isSecret: boolean;
  placeholder?: string;
}

interface ServiceGroup {
  id: string;
  label: string;
  description: string;
  keys: KeyDef[];
}

const SERVICE_GROUPS: ServiceGroup[] = [
  {
    id: "anthropic",
    label: "Anthropic Claude",
    description: "Moteur IA principal — toutes les générations de contenu",
    keys: [{ key: "ANTHROPIC_API_KEY", label: "API Key", isSecret: true }],
  },
  {
    id: "apify",
    label: "Apify",
    description: "Scraping Instagram & recherche concurrents",
    keys: [{ key: "APIFY_TOKEN", label: "Token", isSecret: true }],
  },
  {
    id: "replicate",
    label: "Replicate",
    description: "Génération d'images IA",
    keys: [{ key: "REPLICATE_API_TOKEN", label: "API Token", isSecret: true }],
  },
  {
    id: "resend",
    label: "Resend",
    description: "Envoi d'emails transactionnels",
    keys: [{ key: "RESEND_API_KEY", label: "API Key", isSecret: true }],
  },
  {
    id: "stripe",
    label: "Stripe",
    description: "Paiements & abonnements",
    keys: [
      { key: "STRIPE_SECRET_KEY", label: "Secret Key", isSecret: true },
      {
        key: "STRIPE_WEBHOOK_SECRET",
        label: "Webhook Secret",
        isSecret: true,
        placeholder: "whsec_...",
      },
      {
        key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        label: "Publishable Key",
        isSecret: false,
        placeholder: "pk_live_... ou pk_test_...",
      },
    ],
  },
  {
    id: "unipile",
    label: "Unipile",
    description: "Messagerie LinkedIn & social",
    keys: [
      {
        key: "UNIPILE_API_URL",
        label: "API URL",
        isSecret: false,
        placeholder: "https://api4.unipile.com:13443",
      },
      { key: "UNIPILE_ACCESS_TOKEN", label: "Access Token", isSecret: true },
    ],
  },
];

// ─── Types ─────────────────────────────────────────────────────────────────

type TestStatus = "idle" | "testing" | "pass" | "fail";

interface SettingInfo {
  value: string;
  is_secret: boolean;
  source: "db" | "env" | "unset";
}

// ─── Composant principal ───────────────────────────────────────────────────

export function ApiKeysAdmin() {
  const [settings, setSettings] = useState<Record<string, SettingInfo>>({});
  const [loading, setLoading] = useState(true);

  // Valeurs éditées (key → nouvelle valeur saisie)
  const [edits, setEdits] = useState<Record<string, string>>({});
  // Clés dont l'input est "focusé" (affiche la valeur masquée ou la valeur saisie)
  const [focused, setFocused] = useState<Record<string, boolean>>({});
  // Secrets révélés (type="text")
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  // Sauvegarde en cours
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  // Statuts de test par service
  const [testStatus, setTestStatus] = useState<Record<string, TestStatus>>({});

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      setSettings(data.settings ?? {});
    } catch {
      toast.error("Impossible de charger les paramètres");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (key: string) => {
    const newValue = edits[key];
    if (newValue === undefined || newValue === "") return;

    setSaving((s) => ({ ...s, [key]: true }));
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: newValue }),
      });
      if (!res.ok) throw new Error();
      toast.success("Clé sauvegardée");
      setEdits((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
      await fetchSettings();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  const handleTest = async (serviceId: string) => {
    setTestStatus((s) => ({ ...s, [serviceId]: "testing" }));
    try {
      const res = await fetch("/api/admin/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: serviceId }),
      });
      const data = await res.json();
      setTestStatus((s) => ({
        ...s,
        [serviceId]: data.status === "pass" ? "pass" : "fail",
      }));
    } catch {
      setTestStatus((s) => ({ ...s, [serviceId]: "fail" }));
    }
  };

  const toggleReveal = (key: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCopy = (key: string) => {
    const setting = settings[key];
    if (!setting || setting.source === "unset") return;
    // On copie uniquement la valeur en clair si l'utilisateur vient d'en saisir une
    const toCopy = edits[key] ?? "";
    if (!toCopy) {
      toast.info("Saisissez d'abord la valeur pour la copier");
      return;
    }
    navigator.clipboard.writeText(toCopy);
    toast.success("Copié dans le presse-papiers");
  };

  const getInputValue = (key: string, isSecret: boolean) => {
    // Si l'utilisateur est en train d'éditer
    if (edits[key] !== undefined) return edits[key];
    // Sinon afficher la valeur masquée (ou vide si non configuré)
    const setting = settings[key];
    if (!setting || setting.source === "unset") return "";
    return setting.value; // déjà masquée côté API pour les secrets
  };

  const hasUnsavedChange = (key: string) =>
    edits[key] !== undefined && edits[key] !== "";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {SERVICE_GROUPS.map((group) => {
        const status = testStatus[group.id] ?? "idle";
        const allConfigured = group.keys.every(
          (k) => settings[k.key]?.source !== "unset",
        );

        return (
          <div
            key={group.id}
            className="rounded-[12px] border border-border-default bg-bg-secondary p-5 transition-colors duration-150 hover:border-border-hover"
          >
            {/* En-tête service */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusDot status={status} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {group.label}
                    </span>
                    {group.keys.some((k) => settings[k.key]?.source === "env") && (
                      <Badge variant="muted" className="text-xs">
                        env var
                      </Badge>
                    )}
                    {group.keys.some((k) => settings[k.key]?.source === "db") && (
                      <Badge variant="blue" className="text-xs">
                        DB
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {group.description}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTest(group.id)}
                disabled={status === "testing"}
                className="shrink-0"
              >
                {status === "testing" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FlaskConical className="h-3.5 w-3.5" />
                )}
                <span className="ml-1.5 hidden sm:inline">Tester</span>
              </Button>
            </div>

            {/* Bannière si non configuré */}
            {!allConfigured && (
              <div className="mb-3 flex items-center gap-2 rounded-md bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Une ou plusieurs clés ne sont pas configurées — ce service
                  peut ne pas fonctionner.
                </span>
              </div>
            )}

            {/* Champs */}
            <div className="space-y-2">
              {group.keys.map((keyDef) => {
                const isRevealed = revealed.has(keyDef.key);
                const isSaving = saving[keyDef.key] ?? false;
                const hasChange = hasUnsavedChange(keyDef.key);
                const inputValue = getInputValue(keyDef.key, keyDef.isSecret);
                const source = settings[keyDef.key]?.source ?? "unset";

                return (
                  <div key={keyDef.key} className="flex items-center gap-2">
                    <label className="w-44 shrink-0 text-xs text-muted-foreground">
                      {keyDef.label}
                    </label>
                    <div className="relative flex-1">
                      <Input
                        type={
                          keyDef.isSecret && !isRevealed ? "password" : "text"
                        }
                        value={inputValue}
                        placeholder={
                          keyDef.placeholder ??
                          (source === "unset"
                            ? "Non configuré"
                            : "••••••••••••")
                        }
                        className={cn(
                          "h-8 text-xs font-mono pr-2",
                          source === "unset" && "placeholder:text-yellow-500/60",
                          hasChange && "border-accent/50",
                        )}
                        onFocus={() => {
                          // Vider le masque au focus si l'utilisateur n'a pas déjà saisi
                          if (edits[keyDef.key] === undefined) {
                            setEdits((e) => ({ ...e, [keyDef.key]: "" }));
                          }
                          setFocused((f) => ({ ...f, [keyDef.key]: true }));
                        }}
                        onBlur={() => {
                          // Restaurer l'affichage masqué si rien n'a été saisi
                          if (edits[keyDef.key] === "") {
                            setEdits((e) => {
                              const next = { ...e };
                              delete next[keyDef.key];
                              return next;
                            });
                          }
                          setFocused((f) => ({ ...f, [keyDef.key]: false }));
                        }}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [keyDef.key]: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {keyDef.isSecret && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleReveal(keyDef.key)}
                          title={isRevealed ? "Masquer" : "Afficher"}
                        >
                          {isRevealed ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopy(keyDef.key)}
                        title="Copier"
                        disabled={!hasChange}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant={hasChange ? "default" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleSave(keyDef.key)}
                        disabled={!hasChange || isSaving}
                        title="Sauvegarder"
                      >
                        {isSaving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Sous-composant : indicateur de statut ─────────────────────────────────

function StatusDot({ status }: { status: TestStatus }) {
  if (status === "testing") {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }
  if (status === "pass") {
    return <CheckCircle className="h-4 w-4 text-emerald-400" />;
  }
  if (status === "fail") {
    return <XCircle className="h-4 w-4 text-red-400" />;
  }
  return <Circle className="h-4 w-4 text-muted-foreground/40" />;
}
