"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { OnboardingState } from "@/stores/onboarding-store";
import { Plus, X, Link as LinkIcon } from "lucide-react";

const FORMATION_OPTIONS = [
  "Marketing Digital",
  "Copywriting",
  "Publicité Meta",
  "Vente / Closing",
  "Automatisation",
  "Design",
  "Autre",
];

interface StepProps {
  store: OnboardingState;
  toggleArrayItem: (
    key: "skills" | "industries" | "objectives" | "formations",
    item: string
  ) => void;
}

export function StepResources({ store, toggleArrayItem }: StepProps) {
  const [urlInput, setUrlInput] = useState("");
  const [urls, setUrls] = useState<string[]>([]);

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (trimmed && !urls.includes(trimmed)) {
      setUrls([...urls, trimmed]);
      setUrlInput("");
    }
  };

  const removeUrl = (url: string) => {
    setUrls(urls.filter((u) => u !== url));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-text-primary">
          Formations & Ressources
        </h2>
        <p className="text-text-secondary text-sm">
          Quelles formations as-tu suivies ? Tu peux aussi partager des liens
          YouTube ou Instagram qui t&apos;inspirent.
        </p>
      </div>

      {/* Formations multi-select */}
      <div className="space-y-3">
        <Label>Formations suivies</Label>
        <div className="flex flex-wrap gap-2">
          {FORMATION_OPTIONS.map((formation) => {
            const isSelected = store.formations.includes(formation);
            return (
              <button
                key={formation}
                onClick={() => toggleArrayItem("formations", formation)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200",
                  isSelected
                    ? "border-accent bg-accent-muted text-accent"
                    : "border-border-default text-text-secondary hover:border-border-hover"
                )}
              >
                {formation}
              </button>
            );
          })}
        </div>
      </div>

      {/* URLs */}
      <div className="space-y-3">
        <Label>Liens utiles (YouTube, Instagram, etc.)</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://youtube.com/..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addUrl();
                }
              }}
            />
          </div>
          <Button
            variant="secondary"
            size="icon"
            onClick={addUrl}
            disabled={!urlInput.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {urls.length > 0 && (
          <div className="space-y-2">
            {urls.map((url) => (
              <div
                key={url}
                className="flex items-center gap-2 rounded-[8px] border border-border-default bg-bg-tertiary px-3 py-2"
              >
                <LinkIcon className="h-3.5 w-3.5 text-text-muted shrink-0" />
                <span className="text-sm text-text-secondary truncate flex-1">
                  {url}
                </span>
                <button
                  onClick={() => removeUrl(url)}
                  className="text-text-muted hover:text-danger transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <Badge variant="muted">
              {urls.length} lien{urls.length > 1 ? "s" : ""} ajouté{urls.length > 1 ? "s" : ""}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
