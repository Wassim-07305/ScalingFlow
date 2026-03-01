"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import {
  Sparkles,
  Magnet,
  CheckSquare,
  GraduationCap,
  FileSpreadsheet,
  HelpCircle,
  BookOpen,
  Mail,
} from "lucide-react";
import type { LeadMagnetResult } from "@/lib/ai/prompts/lead-magnet";

interface LeadMagnetGeneratorProps {
  className?: string;
}

type LeadMagnetType = LeadMagnetResult["type"];

const LEAD_MAGNET_TYPES: {
  key: LeadMagnetType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    key: "checklist",
    label: "Checklist",
    description: "Liste de controle actionnable",
    icon: CheckSquare,
  },
  {
    key: "mini_cours",
    label: "Mini-cours",
    description: "3-5 lecons progressives",
    icon: GraduationCap,
  },
  {
    key: "template",
    label: "Template",
    description: "Modele pret a l'emploi",
    icon: FileSpreadsheet,
  },
  {
    key: "quiz",
    label: "Quiz",
    description: "Auto-evaluation interactive",
    icon: HelpCircle,
  },
  {
    key: "guide",
    label: "Guide",
    description: "eBook court et complet",
    icon: BookOpen,
  },
];

export function LeadMagnetGenerator({ className }: LeadMagnetGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  const [leadMagnet, setLeadMagnet] = React.useState<LeadMagnetResult | null>(
    null
  );
  const [error, setError] = React.useState<string | null>(null);
  const [selectedType, setSelectedType] = React.useState<LeadMagnetType | null>(
    null
  );

  const handleGenerate = async () => {
    if (!selectedType) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "lead_magnet",
          leadMagnetType: selectedType,
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la generation");
      const data = await response.json();
      const raw = data.ai_raw_response || data;
      setLeadMagnet(raw as LeadMagnetResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AILoading
        text="Creation de ton lead magnet"
        className={className}
      />
    );
  }

  // Step 1 — Type selector
  if (!leadMagnet) {
    return (
      <div className={cn("space-y-6", className)}>
        {error && (
          <p className="text-sm text-danger text-center">{error}</p>
        )}

        <div className="text-center mb-2">
          <h3 className="text-sm font-medium text-text-primary">
            Choisis le type de lead magnet
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Selectionne le format le plus adapte a ton audience
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {LEAD_MAGNET_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setSelectedType(t.key)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center",
                  selectedType === t.key
                    ? "border-accent bg-accent-muted"
                    : "border-border-default bg-bg-secondary hover:border-border-hover"
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6",
                    selectedType === t.key
                      ? "text-accent"
                      : "text-text-secondary"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    selectedType === t.key
                      ? "text-accent"
                      : "text-text-primary"
                  )}
                >
                  {t.label}
                </span>
                <span className="text-xs text-text-muted">
                  {t.description}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={!selectedType}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generer le lead magnet
          </Button>
        </div>
      </div>
    );
  }

  // Step 2 — Display result
  const content = leadMagnet.content || [];
  const typeConfig = LEAD_MAGNET_TYPES.find((t) => t.key === leadMagnet.type);
  const TypeIcon = typeConfig?.icon || Magnet;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="cyan">
          <TypeIcon className="h-3 w-3 mr-1" />
          {typeConfig?.label || leadMagnet.type}
        </Badge>
        <Badge variant="muted">{content.length} sections</Badge>
      </div>

      {/* Title & Description */}
      <GlowCard glowColor="blue">
        <div className="flex items-center gap-2 mb-2">
          <Magnet className="h-4 w-4 text-accent" />
          <h3 className="font-semibold text-text-primary">
            {leadMagnet.title}
          </h3>
        </div>
        <p className="text-sm text-text-secondary">{leadMagnet.description}</p>
      </GlowCard>

      {/* Content sections */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-text-primary">Contenu</h4>
        {content.map((section, i) => (
          <Card key={i}>
            <CardContent className="py-3">
              <p className="text-sm font-medium text-text-primary mb-2">
                {section.section_title}
              </p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {section.section_content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Opt-in copy */}
      <GlowCard glowColor="purple">
        <h4 className="text-xs text-text-muted font-medium mb-3">
          Texte de la page d&apos;opt-in
        </h4>
        <p className="text-base font-bold text-text-primary mb-1">
          {leadMagnet.opt_in_headline}
        </p>
        <p className="text-sm text-text-secondary">
          {leadMagnet.opt_in_subheadline}
        </p>
      </GlowCard>

      {/* Delivery email */}
      <GlowCard glowColor="blue">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-4 w-4 text-info" />
          <h4 className="text-xs text-text-muted font-medium">
            Email de livraison
          </h4>
        </div>
        <p className="text-sm font-medium text-text-primary mb-2">
          Objet : {leadMagnet.delivery_email_subject}
        </p>
        <p className="text-sm text-text-secondary whitespace-pre-wrap">
          {leadMagnet.delivery_email_body}
        </p>
      </GlowCard>
    </div>
  );
}
