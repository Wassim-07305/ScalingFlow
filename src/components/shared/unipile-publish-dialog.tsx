"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUnipileAccounts } from "@/hooks/use-unipile-accounts";
import { cn } from "@/lib/utils/cn";
import { Loader2, Send, CheckCircle2, XCircle, Settings } from "lucide-react";
import { toast } from "sonner";

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  linkedin: { label: "LinkedIn", color: "bg-blue-600" },
  instagram: { label: "Instagram", color: "bg-pink-600" },
  twitter: { label: "Twitter/X", color: "bg-sky-500" },
};

interface UnipilePublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The text content to publish */
  content: string;
  /** Optional media URLs */
  mediaUrls?: string[];
}

export function UnipilePublishDialog({
  open,
  onOpenChange,
  content,
  mediaUrls,
}: UnipilePublishDialogProps) {
  const { accounts, loading: loadingAccounts } = useUnipileAccounts("social");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<
    { accountId: string; success: boolean; error?: string }[]
  >([]);

  const toggleAccount = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handlePublish = async () => {
    if (selectedIds.length === 0) {
      toast.error("Sélectionne au moins un compte.");
      return;
    }

    setPublishing(true);
    setResults([]);
    const newResults: typeof results = [];

    for (const accountId of selectedIds) {
      try {
        const res = await fetch("/api/integrations/unipile/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account_id: accountId,
            text: content,
            media_urls: mediaUrls?.length ? mediaUrls : undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          newResults.push({
            accountId,
            success: false,
            error: err.error || "Erreur",
          });
        } else {
          newResults.push({ accountId, success: true });
        }
      } catch {
        newResults.push({ accountId, success: false, error: "Erreur réseau" });
      }
    }

    setResults(newResults);
    setPublishing(false);

    const successCount = newResults.filter((r) => r.success).length;
    if (successCount > 0) {
      toast.success(
        `Publié sur ${successCount} compte${successCount > 1 ? "s" : ""} !`
      );
    }
    if (successCount < newResults.length) {
      toast.error(
        `Échec sur ${newResults.length - successCount} compte${newResults.length - successCount > 1 ? "s" : ""}.`
      );
    }
  };

  const hasResults = results.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-accent" />
            Publier via Unipile
          </DialogTitle>
          <DialogDescription>
            Publie ce contenu directement sur tes réseaux connectés.
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        <div className="rounded-lg bg-bg-tertiary p-3 max-h-32 overflow-y-auto">
          <p className="text-xs text-text-muted mb-1">Aperçu du contenu :</p>
          <p className="text-sm text-text-primary whitespace-pre-wrap line-clamp-4">
            {content.slice(0, 300)}
            {content.length > 300 && "..."}
          </p>
        </div>

        {/* Account selection */}
        {loadingAccounts ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-sm text-text-muted">
              Aucun compte social connecté.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                window.location.href = "/settings";
              }}
            >
              <Settings className="h-4 w-4 mr-1" />
              Connecter dans Paramètres
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-text-muted font-medium">
              Sélectionne les comptes :
            </p>
            <div className="flex flex-wrap gap-2">
              {accounts.map((account) => {
                const info = PROVIDER_LABELS[account.provider.toLowerCase()] || {
                  label: account.provider,
                  color: "bg-gray-600",
                };
                const isSelected = selectedIds.includes(account.id);
                const result = results.find((r) => r.accountId === account.id);

                return (
                  <button
                    key={account.id}
                    onClick={() => !hasResults && toggleAccount(account.id)}
                    disabled={hasResults}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                      isSelected
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border-default bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <span
                      className={cn("h-2 w-2 rounded-full", info.color)}
                    />
                    {info.label}
                    {account.username && (
                      <span className="text-text-muted text-xs">
                        @{account.username}
                      </span>
                    )}
                    {result?.success && (
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                    )}
                    {result && !result.success && (
                      <XCircle className="h-4 w-4 text-danger" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          {hasResults ? (
            <Button
              variant="outline"
              onClick={() => {
                setResults([]);
                setSelectedIds([]);
                onOpenChange(false);
              }}
            >
              Fermer
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                onClick={handlePublish}
                disabled={publishing || selectedIds.length === 0}
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Publier ({selectedIds.length})
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
