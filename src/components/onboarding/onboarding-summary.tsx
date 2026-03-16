"use client";

interface OnboardingSummaryProps {
  data: Record<string, unknown>;
}

function Section({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all duration-500 hover:border-white/20 hover:bg-white/[0.07] animate-in fade-in slide-in-from-bottom-3"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-emerald-400">
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-white/40">{label}</span>
      <span className="text-right text-white/80 font-medium">{value}</span>
    </div>
  );
}

const SITUATION_LABELS: Record<string, string> = {
  salarie: "Salarié(e)",
  freelance: "Freelance / Indépendant",
  entrepreneur: "Entrepreneur",
  etudiant: "Étudiant(e)",
  reconversion: "En reconversion",
  sans_emploi: "Sans emploi",
};

import { PARCOURS } from "@/lib/parcours";

const PARCOURS_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(PARCOURS).map(([key, def]) => [key, def.label]),
);

export function OnboardingSummary({ data }: OnboardingSummaryProps) {
  const expertiseAnswers =
    (data.expertiseAnswers as Record<string, string>) || {};
  const industries = (data.industries as string[]) || [];
  const objectives = (data.objectives as string[]) || [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Identité */}
      <Section title="Identité" delay={0}>
        <Row label="Prénom" value={String(data.firstName || "")} />
        <Row
          label="Situation"
          value={SITUATION_LABELS[String(data.situation || "")] || ""}
        />
        <Row
          label="Parcours"
          value={PARCOURS_LABELS[String(data.parcours || "")] || ""}
        />
      </Section>

      {/* Objectifs */}
      <Section title="Objectifs" delay={80}>
        <Row
          label="Objectif revenus"
          value={
            data.targetRevenue
              ? `${Number(data.targetRevenue).toLocaleString("fr-FR")} EUR/mois`
              : ""
          }
        />
        <Row
          label="Budget disponible"
          value={
            data.budgetMonthly !== undefined && Number(data.budgetMonthly) > 0
              ? `${Number(data.budgetMonthly).toLocaleString("fr-FR")} EUR`
              : String(data.budgetMonthly) === "0"
                ? "0 EUR"
                : ""
          }
        />
      </Section>

      {/* Objectifs business */}
      {objectives.length > 0 && (
        <Section title="Objectifs business" delay={160}>
          <div className="flex flex-wrap gap-2">
            {objectives.map((o) => (
              <span
                key={o}
                className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300"
              >
                {o}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Industries */}
      {industries.length > 0 && (
        <Section title="Industries" delay={240}>
          <div className="flex flex-wrap gap-2">
            {industries.map((i) => (
              <span
                key={i}
                className="rounded-full bg-teal-500/15 px-3 py-1 text-xs text-teal-300"
              >
                {i}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Expertise */}
      {expertiseAnswers.q1 && (
        <Section title="Expertise" delay={320}>
          <p className="text-sm text-white/60 leading-relaxed">
            {expertiseAnswers.q1.length > 120
              ? expertiseAnswers.q1.slice(0, 120) + "..."
              : expertiseAnswers.q1}
          </p>
        </Section>
      )}
    </div>
  );
}
