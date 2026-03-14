"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Globe, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { BrandIdentityResult } from "@/lib/ai/prompts/brand-identity";

interface NameGeneratorProps {
  brandId?: string;
  names: BrandIdentityResult["noms"] | null;
  selectedName: string | null;
  className?: string;
}

export function NameGenerator({ brandId, names, selectedName: initialSelected, className }: NameGeneratorProps) {
  const [selected, setSelected] = React.useState<string | null>(initialSelected);
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

  if (!names || !Array.isArray(names) || names.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Sparkles className="h-12 w-12 text-text-muted mx-auto mb-3" />
        <p className="text-text-secondary">
          Aucun nom généré. Lancez la génération pour obtenir des propositions.
        </p>
      </div>
    );
  }

  const disponibiliteVariant = (d: string) => {
    switch (d.toLowerCase()) {
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

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm text-text-secondary mb-4">
        Sélectionnez le nom que vous préférez. Vous pourrez le modifier plus tard.
      </p>
      {names.map((item, i) => (
        <Card
          key={i}
          className={cn(
            "cursor-pointer transition-all",
            selected === item.name
              ? "border-accent bg-accent-muted/10"
              : "hover:border-border-hover"
          )}
          onClick={() => handleSelect(item.name)}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  {selected === item.name ? (
                    <CheckCircle className="h-5 w-5 text-accent shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-border-default shrink-0" />
                  )}
                  <p className="text-base font-semibold text-text-primary">{item.name}</p>
                </div>
                <p className="text-sm text-text-secondary mt-1 pl-8">{item.rationale}</p>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <Globe className="h-3.5 w-3.5 text-text-muted" />
                <Badge variant={disponibiliteVariant(item.disponibilite_probable)}>
                  {item.disponibilite_probable}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {saving && (
        <p className="text-xs text-text-muted text-center">Sauvegarde en cours...</p>
      )}
    </div>
  );
}
