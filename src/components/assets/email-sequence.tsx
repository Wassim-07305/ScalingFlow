"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { Sparkles, Mail, ChevronDown, ChevronUp, Pencil, Check, Send, Save, Loader2 } from "lucide-react";
import { CopyExportBar } from "@/components/shared/copy-export-bar";
import { UnipileSendDialog } from "@/components/shared/unipile-send-dialog";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

const EMAIL_TYPES = [
  { key: "nurturing", label: "Nurturing (éducation)" },
  { key: "launch", label: "Lancement produit" },
  { key: "onboarding", label: "Onboarding client" },
  { key: "reengagement", label: "Réengagement" },
] as const;

interface EmailSequenceProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export function EmailSequence({ className, initialData }: EmailSequenceProps) {
  const { user } = useUser();
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sequence, setSequence] = React.useState<any>(initialData || null);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedEmail, setExpandedEmail] = React.useState<number | null>(0);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = React.useState(false);
  const [sendMessage, setSendMessage] = React.useState("");
  const [savedId, setSavedId] = React.useState<string | null>(null);
  const [isDirty, setIsDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Form state
  const [emailType, setEmailType] = React.useState("nurturing");
  const [emailCount, setEmailCount] = React.useState("7");
  const [emailGoal, setEmailGoal] = React.useState("");

  React.useEffect(() => {
    if (initialData) setSequence(initialData);
  }, [initialData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "email",
          emailType,
          emailCount: parseInt(emailCount),
          emailGoal: emailGoal || undefined,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la génération");
      }
      const data = await response.json();
      if (data.id) setSavedId(data.id);
      setIsDirty(false);
      setSequence(data.ai_raw_response || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const updateEmail = (index: number, field: string, value: string) => {
    if (!sequence) return;
    const updated = { ...sequence };
    const emails = [...(updated.emails || [])];
    emails[index] = { ...emails[index], [field]: value };
    updated.emails = emails;
    setSequence(updated);
    setIsDirty(true);
  };

  const handleSaveEdits = async () => {
    if (!savedId || !user) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("sales_assets")
        .update({
          ai_raw_response: sequence,
          content: JSON.stringify(sequence),
        })
        .eq("id", savedId)
        .eq("user_id", user.id);
      if (error) {
        toast.error("Erreur lors de la sauvegarde");
      } else {
        toast.success("Modifications sauvegardées");
        setIsDirty(false);
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading text="Rédaction de ta séquence email" className={className} />;
  }

  if (!sequence) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-accent" />
              Paramètres de la séquence
            </CardTitle>
            <CardDescription>
              Configure le type et l&apos;objectif de ta séquence email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Email type */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Type de séquence</label>
              <div className="grid grid-cols-2 gap-2">
                {EMAIL_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setEmailType(t.key)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
                      emailType === t.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email count */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Nombre d&apos;emails</label>
              <div className="flex gap-2">
                {["5", "7", "10", "14"].map((n) => (
                  <button
                    key={n}
                    onClick={() => setEmailCount(n)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      emailCount === n
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {n} emails
                  </button>
                ))}
              </div>
            </div>

            {/* Goal */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                Objectif principal <span className="text-text-muted font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={emailGoal}
                onChange={(e) => setEmailGoal(e.target.value)}
                placeholder="Ex: convertir les leads en clients, fidéliser après achat..."
                className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button size="lg" onClick={handleGenerate} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Générer la séquence email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const emails = sequence.emails || [];

  const fullEmailText = emails
    .map((e: { day: number; subject: string; body: string; cta_text: string }) =>
      `## Email Jour ${e.day} — ${e.subject}\n\n${e.body}\n\nCTA: ${e.cta_text}`
    )
    .join("\n\n---\n\n");

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-text-primary">
            {sequence.sequence_name || "Séquence Email"}
          </h3>
          <Badge variant="blue">{emails.length} emails</Badge>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && savedId && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveEdits}
              disabled={saving}
              className="bg-accent hover:bg-accent/90"
            >
              {saving ? (
                <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Sauvegarde...</>
              ) : (
                <><Save className="h-3 w-3 mr-1" /> Sauvegarder les modifications</>
              )}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSequence(null)}>
            Nouveau brief
          </Button>
          <CopyExportBar
            copyContent={fullEmailText}
            pdfTitle={sequence.sequence_name || "Séquence Email"}
            pdfSubtitle={`${emails.length} emails`}
            pdfContent={fullEmailText}
            pdfFilename="sequence-email.pdf"
          />
        </div>
      </div>

      <div className="relative space-y-3">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border-default" />

        {emails.map((email: {
          day: number;
          subject: string;
          preview_text: string;
          body: string;
          cta_text: string;
          pillar: string;
        }, i: number) => {
          const isEditing = editingIndex === i;
          return (
            <div key={i} className="relative pl-12">
              <div className={cn(
                "absolute left-3.5 top-4 w-3 h-3 rounded-full border-2",
                expandedEmail === i
                  ? "bg-accent border-accent"
                  : "bg-bg-tertiary border-border-default"
              )} />

              <Card
                className={cn(
                  "transition-all",
                  expandedEmail === i && "border-accent/30"
                )}
              >
                <CardHeader
                  className="py-3 cursor-pointer"
                  onClick={() => setExpandedEmail(expandedEmail === i ? null : i)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-info" />
                      <div>
                        <CardTitle className="text-sm">{email.subject}</CardTitle>
                        <p className="text-xs text-text-muted mt-0.5">Jour {email.day}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {email.pillar && <Badge variant="muted" className="text-xs">{email.pillar}</Badge>}
                      {expandedEmail === i ? (
                        <ChevronUp className="h-4 w-4 text-text-muted" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-text-muted" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                {expandedEmail === i && (
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-end gap-1 mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSendMessage(`Objet : ${email.subject}\n\n${email.body}\n\n${email.cta_text}`);
                          setSendDialogOpen(true);
                        }}
                      >
                        <Send className="h-3 w-3 mr-1" /> Envoyer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEditing) {
                            setEditingIndex(null);
                            toast.success("Modifications sauvegardées");
                          } else {
                            setEditingIndex(i);
                          }
                        }}
                      >
                        {isEditing ? (
                          <><Check className="h-3 w-3 mr-1" /> OK</>
                        ) : (
                          <><Pencil className="h-3 w-3 mr-1" /> Modifier</>
                        )}
                      </Button>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">Objet</label>
                          <input
                            type="text"
                            value={email.subject}
                            onChange={(e) => updateEmail(i, "subject", e.target.value)}
                            className="w-full rounded-lg border border-border-default bg-bg-secondary px-2 py-1.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">Corps</label>
                          <textarea
                            value={email.body}
                            onChange={(e) => updateEmail(i, "body", e.target.value)}
                            className="w-full rounded-lg border border-border-default bg-bg-secondary px-2 py-1.5 text-sm text-text-secondary resize-vertical focus:outline-none focus:ring-1 focus:ring-accent min-h-[120px]"
                            rows={6}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">CTA</label>
                          <input
                            type="text"
                            value={email.cta_text}
                            onChange={(e) => updateEmail(i, "cta_text", e.target.value)}
                            className="w-full rounded-lg border border-accent/30 bg-bg-secondary px-2 py-1.5 text-sm font-medium text-accent focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        {email.preview_text && (
                          <p className="text-xs text-text-muted italic mb-3">{email.preview_text}</p>
                        )}
                        <div className="text-sm text-text-secondary whitespace-pre-wrap mb-4">
                          {email.body}
                        </div>
                        <div className="p-2 rounded-lg bg-accent-muted border border-accent/20 inline-block">
                          <span className="text-sm font-medium text-accent">{email.cta_text}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      <UnipileSendDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        message={sendMessage}
      />
    </div>
  );
}
