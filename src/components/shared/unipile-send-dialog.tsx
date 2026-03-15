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
import { useUnipileAccounts } from "@/hooks/use-unipile-accounts";
import { cn } from "@/lib/utils/cn";
import {
  Loader2,
  Send,
  CheckCircle2,
  Settings,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

const PROVIDER_LABELS: Record<string, { label: string; emoji: string }> = {
  linkedin: { label: "LinkedIn", emoji: "💼" },
  whatsapp: { label: "WhatsApp", emoji: "💬" },
  instagram: { label: "Instagram", emoji: "📸" },
  messenger: { label: "Messenger", emoji: "💬" },
  telegram: { label: "Telegram", emoji: "✈️" },
  twitter: { label: "Twitter", emoji: "🐦" },
};

interface UnipileSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The message text to send */
  message: string;
  /** Optional: pre-select a platform filter */
  platformFilter?: string;
}

export function UnipileSendDialog({
  open,
  onOpenChange,
  message,
  platformFilter,
}: UnipileSendDialogProps) {
  const { accounts, loading: loadingAccounts } =
    useUnipileAccounts("messaging");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );
  const [recipientId, setRecipientId] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message);

  // Reset edited message when dialog opens with new message
  React.useEffect(() => {
    if (open) {
      setEditedMessage(message);
      setSent(false);
      setSelectedAccountId(null);
      setRecipientId("");
    }
  }, [open, message]);

  const filteredAccounts = platformFilter
    ? accounts.filter(
        (a) => a.provider.toLowerCase() === platformFilter.toLowerCase()
      )
    : accounts;

  const handleSend = async () => {
    if (!selectedAccountId) {
      toast.error("Sélectionne un compte.");
      return;
    }
    if (!recipientId.trim()) {
      toast.error("Indique l'identifiant du destinataire.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/integrations/unipile/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: selectedAccountId,
          attendees_ids: [recipientId.trim()],
          text: editedMessage,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur d'envoi");
      }

      setSent(true);
      toast.success("Message envoyé avec succès !");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'envoi"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-accent" />
            Envoyer via Unipile
          </DialogTitle>
          <DialogDescription>
            Envoie ce message directement depuis un de tes comptes connectés.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="text-center py-6 space-y-2">
            <CheckCircle2 className="h-12 w-12 text-accent mx-auto" />
            <p className="text-sm font-medium text-text-primary">
              Message envoyé !
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </Button>
          </div>
        ) : (
          <>
            {/* Message preview / edit */}
            <div className="space-y-1">
              <label className="text-xs text-text-muted font-medium">
                Message :
              </label>
              <textarea
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
              />
            </div>

            {/* Account selection */}
            {loadingAccounts ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-sm text-text-muted">
                  Aucun compte de messagerie connecté.
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
                <label className="text-xs text-text-muted font-medium">
                  Depuis quel compte :
                </label>
                <div className="flex flex-wrap gap-2">
                  {filteredAccounts.map((account) => {
                    const info =
                      PROVIDER_LABELS[account.provider.toLowerCase()] || {
                        label: account.provider,
                        emoji: "🔗",
                      };
                    const isSelected = selectedAccountId === account.id;

                    return (
                      <button
                        key={account.id}
                        onClick={() => setSelectedAccountId(account.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                          isSelected
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border-default bg-bg-tertiary text-text-secondary hover:text-text-primary"
                        )}
                      >
                        <span>{info.emoji}</span>
                        {info.label}
                        {account.username && (
                          <span className="text-text-muted text-xs">
                            @{account.username}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recipient */}
            {filteredAccounts.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs text-text-muted font-medium">
                  Destinataire (ID ou username) :
                </label>
                <input
                  type="text"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  placeholder="Ex: john.doe ou ID du contact"
                  className="w-full rounded-lg border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSend}
                disabled={
                  sending || !selectedAccountId || !recipientId.trim()
                }
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Envoyer
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
