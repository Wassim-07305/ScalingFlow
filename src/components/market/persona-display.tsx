"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PersonaForgeResult } from "@/lib/ai/prompts/persona-forge";
import {
  User,
  Brain,
  MessageCircle,
  Route,
} from "lucide-react";

const PERSONA_TABS = [
  { key: "demo", label: "Demographique", icon: User },
  { key: "psycho", label: "Psychographique", icon: Brain },
  { key: "langage", label: "Langage", icon: MessageCircle },
  { key: "parcours", label: "Parcours d'achat", icon: Route },
] as const;

type PersonaTabKey = (typeof PERSONA_TABS)[number]["key"];

interface PersonaDisplayProps {
  persona: PersonaForgeResult;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="text-sm text-text-muted min-w-[140px] shrink-0">{label}</span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  );
}

function TagList({ items, variant = "default" }: { items: string[]; variant?: "default" | "red" | "yellow" | "blue" | "purple" | "muted" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <Badge key={i} variant={variant} className="text-xs">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-text-secondary">{title}</h4>
      {children}
    </div>
  );
}

export function PersonaDisplay({ persona }: PersonaDisplayProps) {
  const [activeTab, setActiveTab] = useState<PersonaTabKey>("demo");

  return (
    <div className="space-y-4">
      {/* Header avatar */}
      <Card>
        <CardContent className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted">
            <User className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              {persona.avatar_name}
            </h3>
            <p className="text-sm text-text-secondary">{persona.avatar_role}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PERSONA_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.key
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Niveau 1 : Demographique */}
      {activeTab === "demo" && persona.niveau_1_demo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4 text-accent" />
              Niveau 1 — Profil demographique
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border-default">
            <InfoRow label="Tranche d'age" value={persona.niveau_1_demo.age_range} />
            <InfoRow label="Genre" value={persona.niveau_1_demo.genre} />
            <InfoRow label="Situation familiale" value={persona.niveau_1_demo.situation_familiale} />
            <InfoRow label="Revenu annuel" value={persona.niveau_1_demo.revenu_annuel} />
            <InfoRow label="Localisation" value={persona.niveau_1_demo.localisation} />
            <InfoRow label="Education" value={persona.niveau_1_demo.niveau_education} />
          </CardContent>
        </Card>
      )}

      {/* Niveau 2 : Psychographique */}
      {activeTab === "psycho" && persona.niveau_2_psycho && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-accent" />
              Niveau 2 — Profil psychographique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <SectionBlock title="Desirs profonds">
              <TagList items={persona.niveau_2_psycho.desirs_profonds ?? []} variant="default" />
            </SectionBlock>
            <SectionBlock title="Peurs">
              <TagList items={persona.niveau_2_psycho.peurs ?? []} variant="red" />
            </SectionBlock>
            <SectionBlock title="Frustrations">
              <TagList items={persona.niveau_2_psycho.frustrations ?? []} variant="yellow" />
            </SectionBlock>
            <SectionBlock title="Objections a l'achat">
              <TagList items={persona.niveau_2_psycho.objections_achat ?? []} variant="purple" />
            </SectionBlock>
            <SectionBlock title="Croyances limitantes">
              <TagList items={persona.niveau_2_psycho.croyances_limitantes ?? []} variant="muted" />
            </SectionBlock>
          </CardContent>
        </Card>
      )}

      {/* Niveau 3 : Langage */}
      {activeTab === "langage" && persona.niveau_3_langage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-accent" />
              Niveau 3 — Langage client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <SectionBlock title="Expressions courantes">
              <div className="space-y-1.5">
                {(persona.niveau_3_langage.expressions_courantes ?? []).map((expr, i) => (
                  <p key={i} className="text-sm text-text-primary italic">
                    &laquo; {expr} &raquo;
                  </p>
                ))}
              </div>
            </SectionBlock>
            <SectionBlock title="Mots-cles de recherche">
              <TagList items={persona.niveau_3_langage.mots_cles_recherche ?? []} variant="blue" />
            </SectionBlock>
            <SectionBlock title="Phrases de douleur (verbatim)">
              <div className="space-y-1.5">
                {(persona.niveau_3_langage.phrases_douleur ?? []).map((phrase, i) => (
                  <p key={i} className="text-sm text-danger/80 italic">
                    &laquo; {phrase} &raquo;
                  </p>
                ))}
              </div>
            </SectionBlock>
            <SectionBlock title="Phrases de desir (verbatim)">
              <div className="space-y-1.5">
                {(persona.niveau_3_langage.phrases_desir ?? []).map((phrase, i) => (
                  <p key={i} className="text-sm text-accent italic">
                    &laquo; {phrase} &raquo;
                  </p>
                ))}
              </div>
            </SectionBlock>
            <SectionBlock title="Ton de communication prefere">
              <p className="text-sm text-text-primary">
                {persona.niveau_3_langage.ton_communication}
              </p>
            </SectionBlock>
          </CardContent>
        </Card>
      )}

      {/* Niveau 4 : Parcours d'achat */}
      {activeTab === "parcours" && persona.niveau_4_parcours && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-4 w-4 text-accent" />
              Niveau 4 — Parcours d'achat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <SectionBlock title="Declencheurs d'achat">
              <TagList items={persona.niveau_4_parcours.declencheurs_achat ?? []} variant="default" />
            </SectionBlock>
            <SectionBlock title="Sources d'information">
              <TagList items={persona.niveau_4_parcours.sources_info ?? []} variant="blue" />
            </SectionBlock>
            <SectionBlock title="Criteres de decision">
              <TagList items={persona.niveau_4_parcours.criteres_decision ?? []} variant="purple" />
            </SectionBlock>
            <SectionBlock title="Obstacles a l'achat">
              <TagList items={persona.niveau_4_parcours.obstacles_achat ?? []} variant="red" />
            </SectionBlock>
            <SectionBlock title="Timeline de decision">
              <p className="text-sm text-text-primary">
                {persona.niveau_4_parcours.timeline_decision}
              </p>
            </SectionBlock>
            <SectionBlock title="Influenceurs / Prescripteurs">
              <TagList items={persona.niveau_4_parcours.influenceurs ?? []} variant="muted" />
            </SectionBlock>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
