"use client";

import { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { Bug, X, Send, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

export function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  const reset = () => {
    setSubject("");
    setDescription("");
    setScreenshot(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      toast.error("L'objet et la description sont requis");
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("subject", subject.trim());
      formData.append("description", description.trim());
      formData.append("page", pathname);
      if (screenshot) {
        formData.append("screenshot", screenshot);
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur");
      }

      toast.success("Bug signalé ! Merci pour ton retour.");
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-bg-secondary border border-border-default shadow-lg hover:bg-bg-tertiary hover:border-accent/30 transition-all group"
        title="Signaler un bug"
      >
        <Bug className="h-5 w-5 text-text-muted group-hover:text-accent transition-colors" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { if (!sending) setOpen(false); }}
          />

          {/* Dialog */}
          <div className="relative w-full max-w-md rounded-2xl border border-border-default bg-bg-secondary shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                  <Bug className="h-4 w-4 text-red-400" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary">Signaler un bug</h3>
              </div>
              <button
                onClick={() => { if (!sending) setOpen(false); }}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 px-5 py-4">
              {/* Subject */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Objet *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Le bouton générer ne fonctionne pas"
                  className="w-full rounded-xl bg-bg-tertiary border border-border-default px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50"
                  disabled={sending}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décris ce qui s'est passé, ce que tu attendais, et les étapes pour reproduire le bug..."
                  rows={4}
                  className="w-full rounded-xl bg-bg-tertiary border border-border-default px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 resize-none"
                  disabled={sending}
                />
              </div>

              {/* Screenshot */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Capture d'écran (optionnel)</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  className="hidden"
                  disabled={sending}
                />
                {screenshot ? (
                  <div className="flex items-center gap-2 rounded-xl bg-bg-tertiary border border-border-default px-3 py-2.5">
                    <ImagePlus className="h-4 w-4 text-accent shrink-0" />
                    <span className="text-xs text-text-secondary truncate flex-1">{screenshot.name}</span>
                    <button
                      onClick={() => { setScreenshot(null); if (fileRef.current) fileRef.current.value = ""; }}
                      className="text-text-muted hover:text-red-400 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-border-default py-3 text-xs text-text-muted hover:text-text-secondary hover:border-text-muted transition-colors"
                    disabled={sending}
                  >
                    <ImagePlus className="h-4 w-4" />
                    Ajouter une capture d'écran
                  </button>
                )}
              </div>

              {/* Page info */}
              <p className="text-[10px] text-text-muted">
                Page actuelle : <code className="text-text-secondary">{pathname}</code>
              </p>
            </div>

            {/* Footer */}
            <div className="border-t border-border-default px-5 py-3 flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={sending || !subject.trim() || !description.trim()}
                className={cn("gap-2", sending && "opacity-70")}
                size="sm"
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {sending ? "Envoi..." : "Envoyer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
