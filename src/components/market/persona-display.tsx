"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PersonaForgeResult } from "@/lib/ai/prompts/persona-forge";
import {
  User,
  Brain,
  MousePointerClick,
  Target,
  BookOpen,
  Download,
  Tv,
  Route,
  Smartphone,
  Clock,
  MessageSquare,
  ShieldAlert,
  Zap,
  Globe,
  BarChart3,
} from "lucide-react";
import { exportToPDF } from "@/lib/utils/export-pdf";

const PERSONA_TABS = [
  { key: "bio", label: "Bio & Journée", icon: BookOpen },
  { key: "demo", label: "Démographique", icon: User },
  { key: "psycho", label: "Psychographique", icon: Brain },
  { key: "comportemental", label: "Comportemental", icon: MousePointerClick },
  { key: "strategique", label: "Stratégique", icon: Target },
] as const;

type PersonaTabKey = (typeof PERSONA_TABS)[number]["key"];

function buildPersonaPDFContent(persona: PersonaForgeResult): string {
  let text = `AVATAR CLIENT — ${persona.avatar_name}\n`;
  text += `Rôle : ${persona.avatar_role}\n\n`;

  if (persona.bio_fictive) {
    text += `=== BIO FICTIVE ===\n${persona.bio_fictive}\n\n`;
  }
  if (persona.journee_type) {
    text += `=== JOURNÉE TYPE ===\n${persona.journee_type}\n\n`;
  }
  if (persona.canaux_medias?.length) {
    text += `=== CANAUX MÉDIAS ===\n${persona.canaux_medias.join("\n")}\n\n`;
  }

  const d = persona.niveau_1_demo;
  if (d) {
    text += `=== NIVEAU 1 — DÉMOGRAPHIQUE ===\nÂge : ${d.age_range}\nGenre : ${d.genre}\nSituation familiale : ${d.situation_familiale}\nRevenu annuel : ${d.revenu_annuel}\nLocalisation : ${d.localisation}\nSituation pro : ${d.situation_pro || "—"}\nÉducation : ${d.niveau_education}\n\n`;
  }

  const p = persona.niveau_2_psycho;
  if (p) {
    text += `=== NIVEAU 2 — PSYCHOGRAPHIQUE ===\nPeurs : ${p.peurs?.join(", ")}\nFrustrations : ${p.frustrations?.join(", ")}\nDésirs profonds : ${p.desirs_profonds?.join(", ")}\nCroyances limitantes : ${p.croyances_limitantes?.join(", ")}\nDéclencheurs d'achat : ${p.declencheurs_achat?.join(", ")}\n\n`;
  }

  const c = persona.niveau_3_comportemental;
  if (c) {
    text += `=== NIVEAU 3 — COMPORTEMENTAL ===\nHabitudes digitales : ${c.habitudes_digitales?.join(", ")}\nRéseaux sociaux : ${c.reseaux_sociaux?.join(", ")}\nContenu consommé : ${c.type_contenu_consomme?.join(", ")}\nObjections typiques : ${c.objections_typiques?.join(", ")}\nFréquence d'achat : ${c.frequence_achat_en_ligne || "—"}\nAppareils : ${c.appareils_utilises?.join(", ")}\n\n`;
  }

  const s = persona.niveau_4_strategique;
  if (s) {
    text += `=== NIVEAU 4 — STRATÉGIQUE ===\nParcours d'achat : ${s.parcours_achat?.join(" → ")}\nPoints de contact : ${s.points_contact_optimaux?.join(", ")}\nMessages qui résonnent : ${s.messages_qui_resonnent?.join(" | ")}\nTiming idéal : ${s.timing_ideal}\nCritères de décision : ${s.criteres_decision?.join(", ")}\nInfluenceurs : ${s.influenceurs_prescripteurs?.join(", ")}`;
  }

  return text;
}

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

function SectionBlock({ title, icon: Icon, children }: { title: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-accent/70" />}
        {title}
      </h4>
      {children}
    </div>
  );
}

function LevelBadge({ level, label }: { level: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-bold">
        {level}
      </span>
      <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</span>
    </div>
  );
}

export function PersonaDisplay({ persona }: PersonaDisplayProps) {
  const [activeTab, setActiveTab] = useState<PersonaTabKey>("bio");

  const handleExportPDF = () => {
    exportToPDF({
      title: `Persona — ${persona.avatar_name}`,
      subtitle: persona.avatar_role,
      content: buildPersonaPDFContent(persona),
      filename: `persona-${persona.avatar_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header avatar */}
      <Card>
        <CardContent className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted">
            <User className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary">
              {persona.avatar_name}
            </h3>
            <p className="text-sm text-text-secondary">{persona.avatar_role}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1" />
            Exporter PDF
          </Button>
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

      {/* Bio, Journée type & Canaux médias */}
      {activeTab === "bio" && (
        <div className="space-y-4">
          {persona.bio_fictive && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-accent" />
                  Bio fictive
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-primary leading-relaxed">{persona.bio_fictive}</p>
              </CardContent>
            </Card>
          )}

          {persona.journee_type && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" />
                  Journée type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-primary leading-relaxed">{persona.journee_type}</p>
              </CardContent>
            </Card>
          )}

          {persona.canaux_medias && persona.canaux_medias.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tv className="h-4 w-4 text-accent" />
                  Canaux médias consommés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {persona.canaux_medias.map((canal, i) => (
                    <Badge key={i} variant="blue" className="text-xs">
                      {canal}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Niveau 1 : Démographique */}
      {activeTab === "demo" && persona.niveau_1_demo && (
        <Card>
          <CardHeader>
            <div className="space-y-1">
              <LevelBadge level={1} label="Démographique" />
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4 text-accent" />
                Âge, sexe, localisation, revenus, situation pro
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-border-default">
            <InfoRow label="Tranche d'âge" value={persona.niveau_1_demo.age_range} />
            <InfoRow label="Genre" value={persona.niveau_1_demo.genre} />
            <InfoRow label="Situation familiale" value={persona.niveau_1_demo.situation_familiale} />
            <InfoRow label="Revenu annuel" value={persona.niveau_1_demo.revenu_annuel} />
            <InfoRow label="Localisation" value={persona.niveau_1_demo.localisation} />
            <InfoRow label="Situation pro" value={persona.niveau_1_demo.situation_pro || "—"} />
            <InfoRow label="Éducation" value={persona.niveau_1_demo.niveau_education} />
          </CardContent>
        </Card>
      )}

      {/* Niveau 2 : Psychographique */}
      {activeTab === "psycho" && persona.niveau_2_psycho && (
        <Card>
          <CardHeader>
            <div className="space-y-1">
              <LevelBadge level={2} label="Psychographique" />
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-accent" />
                Peurs, frustrations, désirs, croyances, déclencheurs
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <SectionBlock title="Peurs" icon={ShieldAlert}>
              <TagList items={persona.niveau_2_psycho.peurs ?? []} variant="red" />
            </SectionBlock>
            <SectionBlock title="Frustrations">
              <TagList items={persona.niveau_2_psycho.frustrations ?? []} variant="yellow" />
            </SectionBlock>
            <SectionBlock title="Désirs profonds">
              <TagList items={persona.niveau_2_psycho.desirs_profonds ?? []} variant="default" />
            </SectionBlock>
            <SectionBlock title="Croyances limitantes">
              <TagList items={persona.niveau_2_psycho.croyances_limitantes ?? []} variant="muted" />
            </SectionBlock>
            <SectionBlock title="Déclencheurs d'achat" icon={Zap}>
              <TagList items={persona.niveau_2_psycho.declencheurs_achat ?? []} variant="purple" />
            </SectionBlock>
          </CardContent>
        </Card>
      )}

      {/* Niveau 3 : Comportemental */}
      {activeTab === "comportemental" && persona.niveau_3_comportemental && (
        <Card>
          <CardHeader>
            <div className="space-y-1">
              <LevelBadge level={3} label="Comportemental" />
              <CardTitle className="flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-accent" />
                Habitudes digitales, réseaux, contenu, objections
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <SectionBlock title="Habitudes digitales" icon={Globe}>
              <div className="space-y-1.5">
                {(persona.niveau_3_comportemental.habitudes_digitales ?? []).map((h, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                    <p className="text-sm text-text-primary">{h}</p>
                  </div>
                ))}
              </div>
            </SectionBlock>
            <SectionBlock title="Réseaux sociaux utilisés">
              <TagList items={persona.niveau_3_comportemental.reseaux_sociaux ?? []} variant="blue" />
            </SectionBlock>
            <SectionBlock title="Type de contenu consommé">
              <TagList items={persona.niveau_3_comportemental.type_contenu_consomme ?? []} variant="default" />
            </SectionBlock>
            <SectionBlock title="Objections typiques" icon={MessageSquare}>
              <div className="space-y-1.5">
                {(persona.niveau_3_comportemental.objections_typiques ?? []).map((obj, i) => (
                  <p key={i} className="text-sm text-danger/80 italic">
                    &laquo; {obj} &raquo;
                  </p>
                ))}
              </div>
            </SectionBlock>
            <SectionBlock title="Fréquence d'achat en ligne">
              <p className="text-sm text-text-primary">
                {persona.niveau_3_comportemental.frequence_achat_en_ligne || "—"}
              </p>
            </SectionBlock>
            <SectionBlock title="Appareils utilisés" icon={Smartphone}>
              <TagList items={persona.niveau_3_comportemental.appareils_utilises ?? []} variant="muted" />
            </SectionBlock>
          </CardContent>
        </Card>
      )}

      {/* Niveau 4 : Stratégique */}
      {activeTab === "strategique" && persona.niveau_4_strategique && (
        <Card>
          <CardHeader>
            <div className="space-y-1">
              <LevelBadge level={4} label="Stratégique" />
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                Parcours d'achat, points de contact, messages, timing
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <SectionBlock title="Parcours d'achat" icon={Route}>
              <div className="space-y-2">
                {(persona.niveau_4_strategique.parcours_achat ?? []).map((etape, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-text-primary">{etape}</p>
                  </div>
                ))}
              </div>
            </SectionBlock>
            <SectionBlock title="Points de contact optimaux" icon={BarChart3}>
              <TagList items={persona.niveau_4_strategique.points_contact_optimaux ?? []} variant="blue" />
            </SectionBlock>
            <SectionBlock title="Messages qui résonnent">
              <div className="space-y-1.5">
                {(persona.niveau_4_strategique.messages_qui_resonnent ?? []).map((msg, i) => (
                  <p key={i} className="text-sm text-accent italic">
                    &laquo; {msg} &raquo;
                  </p>
                ))}
              </div>
            </SectionBlock>
            <SectionBlock title="Timing idéal" icon={Clock}>
              <p className="text-sm text-text-primary">
                {persona.niveau_4_strategique.timing_ideal}
              </p>
            </SectionBlock>
            <SectionBlock title="Critères de décision">
              <TagList items={persona.niveau_4_strategique.criteres_decision ?? []} variant="purple" />
            </SectionBlock>
            <SectionBlock title="Influenceurs / Prescripteurs">
              <TagList items={persona.niveau_4_strategique.influenceurs_prescripteurs ?? []} variant="muted" />
            </SectionBlock>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
