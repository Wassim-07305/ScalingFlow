"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Globe, Sparkles, Hash, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { BrandIdentityResult } from "@/lib/ai/prompts/brand-identity";

interface NameGeneratorProps {
  brandId?: string;
  names: BrandIdentityResult["noms"] | null;
  selectedName: string | null;
  className?: string;
}

export function NameGenerator({
  brandId,
  names,
  selectedName: initialSelected,
  className,
}: NameGeneratorProps) {
  const [selected, setSelected] = React.useState<string | null>(
    initialSelected,
  );
  const [saving, setSaving] = React.useState(false);
  const supabase = createClient();

  const handleSelect = async (name: string) => {
    if (!brandId) return;

    setSelected(name);
    setSaving(true);

    try {
      const { error } = await supabase
        .from("brand_identities")
        .update({ selected_name: name })
        .eq("id", brandId);

      if (error) throw error;
      toast.success(`"${name}" sélectionné comme nom de marque !`);
    } catch {
      toast.error("Erreur lors de la sauvegarde");
      setSelected(initialSelected);
    } finally {
      setSaving(false);
    }
  };

  // Normalize items: handle any data structure the AI may have returned
  const normalizedNames = React.useMemo(() => {
    if (!names || !Array.isArray(names) || names.length === 0) return [];
    return names
      .map((item) => {
        // Handle plain string items
        if (typeof item === "string") {
          return {
            name: item,
            rationale: "",
            disponibilite_probable: "",
            domain_suggestions: [] as string[],
            availability_hint: "" as string,
            hashtags: [] as string[],
          };
        }
        if (typeof item !== "object" || item === null) {
          return {
            name: String(item ?? ""),
            rationale: "",
            disponibilite_probable: "",
            domain_suggestions: [] as string[],
            availability_hint: "" as string,
            hashtags: [] as string[],
          };
        }
        const raw = item as unknown as Record<string, unknown>;
        const keys = Object.keys(raw);
        // Try known keys first, then fallback to first string value in the object
        const findStr = (...candidates: string[]): string => {
          for (const k of candidates) {
            if (raw[k] != null && String(raw[k]).length > 0)
              return String(raw[k]);
          }
          return "";
        };
        const findArr = (...candidates: string[]): string[] => {
          for (const k of candidates) {
            if (Array.isArray(raw[k])) return raw[k] as string[];
          }
          return [];
        };
        const nameVal =
          findStr("name", "nom", "brand_name", "titre", "title") ||
          (keys.length > 0 && typeof raw[keys[0]] === "string"
            ? String(raw[keys[0]])
            : "");
        const rationaleVal =
          findStr(
            "rationale",
            "justification",
            "raison",
            "explication",
            "description",
            "why",
          ) ||
          (keys.length > 1 && typeof raw[keys[1]] === "string"
            ? String(raw[keys[1]])
            : "");
        const dispoVal = findStr(
          "disponibilite_probable",
          "disponibilite",
          "disponibilité",
          "disponibilité_probable",
          "availability",
          "dispo",
        );
        const domainSuggestions = findArr(
          "domain_suggestions",
          "domains",
          "domaines",
        );
        const availabilityHint = findStr(
          "availability_hint",
          "disponibilite_domaine",
        );
        const hashtags = findArr("hashtags", "tags");
        return {
          name: nameVal,
          rationale: rationaleVal,
          disponibilite_probable: dispoVal,
          domain_suggestions: domainSuggestions,
          availability_hint: availabilityHint,
          hashtags,
        };
      })
      .filter((item) => item.name.length > 0);
  }, [names]);

  if (normalizedNames.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Sparkles className="h-12 w-12 text-text-muted mx-auto mb-3" />
        <p className="text-text-secondary">
          Aucun nom généré. Lance la génération pour obtenir des propositions.
        </p>
      </div>
    );
  }

  const disponibiliteVariant = (d?: string) => {
    switch ((d || "").toLowerCase()) {
      case "haute":
        return "default";
      case "moyenne":
        return "yellow";
      case "basse":
        return "red";
      default:
        return "muted";
    }
  };

  const availabilityHintVariant = (hint?: string) => {
    switch (hint) {
      case "probablement disponible":
        return "default";
      case "vérifier":
        return "yellow";
      case "probablement pris":
        return "red";
      default:
        return "muted";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm text-text-secondary mb-4">
        Sélectionne le nom que tu préfères. Tu pourras le modifier plus tard.
      </p>
      {normalizedNames.map((item, i) => (
        <Card
          key={i}
          className={cn(
            "cursor-pointer transition-all duration-200",
            selected === item.name
              ? "border-accent bg-gradient-to-r from-accent/8 to-transparent shadow-lg shadow-accent/5 ring-1 ring-accent/30"
              : "hover:border-border-hover hover:shadow-md",
          )}
          onClick={() => handleSelect(item.name)}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  {selected === item.name ? (
                    <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center ring-2 ring-accent/40">
                      <CheckCircle className="h-4 w-4 text-accent" />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-border-default shrink-0 transition-all hover:border-accent/30" />
                  )}
                  <p className="text-base font-bold text-text-primary">
                    {item.name}
                  </p>
                </div>
                {item.rationale && (
                  <p className="text-sm text-text-secondary mt-1.5 pl-9 leading-relaxed">
                    {item.rationale}
                  </p>
                )}

                {/* Domain suggestions */}
                {item.domain_suggestions.length > 0 && (
                  <div className="mt-2 pl-9 flex flex-wrap items-center gap-1.5">
                    <ExternalLink className="h-3 w-3 text-text-muted shrink-0" />
                    {item.domain_suggestions.map((domain, di) => (
                      <span
                        key={di}
                        className="text-xs px-2 py-0.5 rounded-md bg-bg-tertiary text-text-secondary font-mono"
                      >
                        {domain}
                      </span>
                    ))}
                    {item.availability_hint && (
                      <Badge
                        variant={availabilityHintVariant(
                          item.availability_hint,
                        )}
                        className="text-[10px] ml-1"
                      >
                        {item.availability_hint}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Hashtags */}
                {item.hashtags.length > 0 && (
                  <div className="mt-1.5 pl-9 flex flex-wrap items-center gap-1.5">
                    <Hash className="h-3 w-3 text-text-muted shrink-0" />
                    {item.hashtags.map((tag, ti) => (
                      <span
                        key={ti}
                        className="text-xs px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <Globe className="h-3.5 w-3.5 text-text-muted" />
                <Badge
                  variant={disponibiliteVariant(item.disponibilite_probable)}
                >
                  {item.disponibilite_probable || "\u2014"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {saving && (
        <p className="text-xs text-text-muted text-center">
          Sauvegarde en cours...
        </p>
      )}
    </div>
  );
}
