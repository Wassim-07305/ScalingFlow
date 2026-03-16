"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  Linkedin,
  Instagram,
  Twitter,
  CheckCircle2,
  ImagePlus,
  X,
  Eye,
  Share2,
  MessageCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

interface UnipileAccount {
  id: string;
  provider: string;
  name?: string;
  username?: string;
}

interface PublishResult {
  account_id: string;
  provider: string;
  success: boolean;
  error?: string;
}

// ─── Provider config (only posting-capable) ───────────────────

const POSTABLE_PROVIDERS: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  LINKEDIN: { label: "LinkedIn", icon: Linkedin, color: "text-blue-400" },
  INSTAGRAM: { label: "Instagram", icon: Instagram, color: "text-pink-400" },
  TWITTER: { label: "Twitter", icon: Twitter, color: "text-sky-400" },
};

// ─── Component ────────────────────────────────────────────────

interface SocialPublisherProps {
  initialContent?: string;
}

export function SocialPublisher({ initialContent }: SocialPublisherProps) {
  const [accounts, setAccounts] = useState<UnipileAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(
    new Set(),
  );
  const [content, setContent] = useState(initialContent || "");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<PublishResult[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // ── Fetch accounts ──────────────────────────────────────────

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/unipile/accounts");
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Filter to postable providers only
      const postable = (data.accounts || []).filter((a: UnipileAccount) =>
        Object.keys(POSTABLE_PROVIDERS).includes(a.provider.toUpperCase()),
      );
      setAccounts(postable);
    } catch {
      // silent
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (initialContent) setContent(initialContent);
  }, [initialContent]);

  // ── Toggle account selection ────────────────────────────────

  const toggleAccount = (id: string) => {
    setSelectedAccountIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ── Add media URL ───────────────────────────────────────────

  const addMediaUrl = () => {
    const url = newMediaUrl.trim();
    if (!url) return;
    if (mediaUrls.includes(url)) {
      toast.error("Cette URL est déjà ajoutée");
      return;
    }
    setMediaUrls((prev) => [...prev, url]);
    setNewMediaUrl("");
  };

  const removeMediaUrl = (url: string) => {
    setMediaUrls((prev) => prev.filter((u) => u !== url));
  };

  // ── Publish ─────────────────────────────────────────────────

  const handlePublish = async () => {
    if (!content.trim()) {
      toast.error("Le contenu ne peut pas être vide");
      return;
    }
    if (selectedAccountIds.size === 0) {
      toast.error("Sélectionne au moins un compte");
      return;
    }

    setPublishing(true);
    setResults([]);

    const publishResults: PublishResult[] = [];

    for (const accountId of selectedAccountIds) {
      const account = accounts.find((a) => a.id === accountId);
      if (!account) continue;

      try {
        const res = await fetch("/api/integrations/unipile/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account_id: accountId,
            text: content.trim(),
            media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          publishResults.push({
            account_id: accountId,
            provider: account.provider,
            success: false,
            error: errData.error || "Erreur inconnue",
          });
        } else {
          publishResults.push({
            account_id: accountId,
            provider: account.provider,
            success: true,
          });
        }
      } catch {
        publishResults.push({
          account_id: accountId,
          provider: account.provider,
          success: false,
          error: "Erreur réseau",
        });
      }
    }

    setResults(publishResults);

    const successCount = publishResults.filter((r) => r.success).length;
    const failCount = publishResults.filter((r) => !r.success).length;

    if (failCount === 0) {
      toast.success(
        `Publication réussie sur ${successCount} compte${successCount > 1 ? "s" : ""} !`,
      );
    } else if (successCount === 0) {
      toast.error("Échec de la publication sur tous les comptes");
    } else {
      toast.warning(
        `${successCount} réussi${successCount > 1 ? "s" : ""}, ${failCount} échoué${failCount > 1 ? "s" : ""}`,
      );
    }

    setPublishing(false);
  };

  // ── No accounts state ──────────────────────────────────────

  if (!loadingAccounts && accounts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Share2 className="h-12 w-12 text-text-muted mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Aucun compte social connecté
          </h3>
          <p className="text-sm text-text-secondary max-w-md">
            Connecte tes comptes sociaux (LinkedIn, Instagram, Twitter) depuis
            les{" "}
            <a href="/settings" className="text-accent underline">
              paramètres
            </a>{" "}
            via Unipile pour publier directement.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-accent" />
            Publier sur les réseaux sociaux
          </CardTitle>
          <CardDescription>
            Publie ton contenu simultanément sur plusieurs plateformes
            connectées via Unipile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Account selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Comptes cibles</Label>
            {loadingAccounts ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                <span className="text-sm text-text-muted">
                  Chargement des comptes...
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {accounts.map((account) => {
                  const providerKey = account.provider.toUpperCase();
                  const cfg = POSTABLE_PROVIDERS[providerKey];
                  if (!cfg) return null;
                  const Icon = cfg.icon;
                  const isSelected = selectedAccountIds.has(account.id);

                  return (
                    <button
                      key={account.id}
                      onClick={() => toggleAccount(account.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                        isSelected
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border-default bg-bg-secondary text-text-secondary hover:border-text-muted",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          isSelected ? "text-accent" : cfg.color,
                        )}
                      />
                      <span>{cfg.label}</span>
                      {account.username && (
                        <span className="text-xs text-text-muted">
                          @{account.username}
                        </span>
                      )}
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-accent ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Content textarea */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Contenu de la publication
            </Label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Écris le contenu de ta publication ici..."
              rows={6}
              className="w-full rounded-xl border border-border-default bg-bg-tertiary px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
            />
            <div className="flex justify-between text-xs text-text-muted">
              <span>{content.length} caractères</span>
              {content.length > 280 && (
                <span className="text-amber-400">
                  Dépasse la limite Twitter (280 car.)
                </span>
              )}
            </div>
          </div>

          {/* Media URLs */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Médias (optionnel)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="URL de l'image ou vidéo..."
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMediaUrl();
                  }
                }}
                className="bg-bg-tertiary"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addMediaUrl}
                disabled={!newMediaUrl.trim()}
                className="shrink-0"
              >
                <ImagePlus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
            {mediaUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {mediaUrls.map((url) => (
                  <div
                    key={url}
                    className="flex items-center gap-2 bg-bg-tertiary rounded-lg px-3 py-1.5 text-xs"
                  >
                    <span className="truncate max-w-[200px] text-text-secondary">
                      {url}
                    </span>
                    <button
                      onClick={() => removeMediaUrl(url)}
                      className="text-text-muted hover:text-danger"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview toggle */}
          {content.trim() && (
            <div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? "Masquer l'aperçu" : "Voir l'aperçu"}
              </button>

              {showPreview && (
                <div className="mt-3 rounded-xl border border-border-default bg-bg-tertiary p-4 space-y-3">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Aperçu
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-text-primary whitespace-pre-wrap">
                      {content}
                    </p>
                    {mediaUrls.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {mediaUrls.map((url) => (
                          <div
                            key={url}
                            className="h-20 w-20 rounded-lg bg-bg-secondary border border-border-default flex items-center justify-center overflow-hidden"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt="Média"
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(selectedAccountIds).map((id) => {
                      const account = accounts.find((a) => a.id === id);
                      if (!account) return null;
                      const cfg =
                        POSTABLE_PROVIDERS[account.provider.toUpperCase()];
                      if (!cfg) return null;
                      const Icon = cfg.icon;
                      return (
                        <Badge
                          key={id}
                          variant="default"
                          className="text-xs flex items-center gap-1"
                        >
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Publish button */}
          <Button
            onClick={handlePublish}
            disabled={
              publishing || !content.trim() || selectedAccountIds.size === 0
            }
            className="w-full sm:w-auto"
          >
            {publishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Publication en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Publier sur {selectedAccountIds.size} compte
                {selectedAccountIds.size > 1 ? "s" : ""}
              </>
            )}
          </Button>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Résultats
              </p>
              {results.map((r) => {
                const cfg = POSTABLE_PROVIDERS[r.provider.toUpperCase()];
                const Icon = cfg?.icon || MessageCircle;
                return (
                  <div
                    key={r.account_id}
                    className="flex items-center gap-3 py-2"
                  >
                    <Icon
                      className={cn("h-4 w-4", cfg?.color || "text-text-muted")}
                    />
                    <span className="text-sm text-text-primary">
                      {cfg?.label || r.provider}
                    </span>
                    {r.success ? (
                      <Badge
                        variant="default"
                        className="bg-green-500/20 text-green-400 text-xs"
                      >
                        Publié
                      </Badge>
                    ) : (
                      <Badge
                        variant="default"
                        className="bg-red-500/20 text-red-400 text-xs"
                      >
                        Échoué : {r.error}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
