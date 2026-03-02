"use client";

import type { VaultSkillCategory } from "@/stores/onboarding-store";

interface OnboardingSummaryProps {
  data: Record<string, unknown>;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
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
    <div className="flex justify-between text-sm">
      <span className="text-white/40">{label}</span>
      <span className="text-right text-white/80">{value}</span>
    </div>
  );
}

const SITUATION_LABELS: Record<string, string> = {
  zero: "Partir de zero",
  salarie: "Salarie(e)",
  freelance: "Freelance",
  entrepreneur: "Entrepreneur",
};

const PARCOURS_LABELS: Record<string, string> = {
  A1: "Partir de Zero",
  A2: "Salarie → Freelance",
  A3: "Freelance → Entrepreneur",
  B: "Scaler",
  C: "Pivoter",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "Debutant",
  intermediate: "Intermediaire",
  advanced: "Avance",
};

export function OnboardingSummary({ data }: OnboardingSummaryProps) {
  const vaultSkills = (data.vaultSkills as VaultSkillCategory[]) || [];
  const expertiseAnswers =
    (data.expertiseAnswers as Record<string, string>) || {};
  const industries = (data.industries as string[]) || [];
  const objectives = (data.objectives as string[]) || [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Identite */}
      <Section title="Identite">
        <Row
          label="Nom"
          value={`${data.firstName || ""} ${data.lastName || ""}`.trim()}
        />
        <Row label="Pays" value={String(data.country || "")} />
        <Row
          label="Langue"
          value={String(data.language || "") === "fr" ? "Francais" : String(data.language || "")}
        />
      </Section>

      {/* Situation */}
      <Section title="Situation">
        <Row
          label="Statut"
          value={SITUATION_LABELS[String(data.situation || "")] || ""}
        />
        <Row label="Parcours" value={PARCOURS_LABELS[String(data.parcours || "")] || ""} />
        <Row
          label="Experience"
          value={EXPERIENCE_LABELS[String(data.experienceLevel || "")] || ""}
        />
      </Section>

      {/* Competences */}
      <Section title="Competences">
        {vaultSkills.length > 0 ? (
          vaultSkills.map((s) => (
            <Row
              key={s.name}
              label={s.name}
              value={
                s.level === "debutant"
                  ? "Debutant"
                  : s.level === "intermediaire"
                    ? "Intermediaire"
                    : "Avance"
              }
            />
          ))
        ) : (
          <p className="text-sm text-white/30">Non renseigne</p>
        )}
      </Section>

      {/* Chiffres */}
      <Section title="Chiffres">
        <Row
          label="Revenu actuel"
          value={
            data.currentRevenue
              ? `${Number(data.currentRevenue).toLocaleString("fr-FR")} EUR/mois`
              : ""
          }
        />
        <Row
          label="Objectif"
          value={
            data.targetRevenue
              ? `${Number(data.targetRevenue).toLocaleString("fr-FR")} EUR/mois`
              : ""
          }
        />
        <Row
          label="Budget pub"
          value={
            data.budgetMonthly !== undefined && data.budgetMonthly !== 0
              ? `${Number(data.budgetMonthly).toLocaleString("fr-FR")} EUR/mois`
              : data.budgetMonthly === 0
                ? "Pas de budget"
                : ""
          }
        />
      </Section>

      {/* Objectifs */}
      <Section title="Objectifs">
        {objectives.length > 0 ? (
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
        ) : (
          <p className="text-sm text-white/30">Non renseigne</p>
        )}
      </Section>

      {/* Industries */}
      <Section title="Industries">
        {industries.length > 0 ? (
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
        ) : (
          <p className="text-sm text-white/30">Non renseigne</p>
        )}
      </Section>

      {/* Expertise (resumes) */}
      {Object.values(expertiseAnswers).some((v) => v) && (
        <Section title="Expertise">
          {expertiseAnswers.q1 && (
            <Row
              label="Accomplissement"
              value={
                expertiseAnswers.q1.length > 60
                  ? expertiseAnswers.q1.slice(0, 60) + "..."
                  : expertiseAnswers.q1
              }
            />
          )}
          {expertiseAnswers.q2 && (
            <Row
              label="Methode unique"
              value={
                expertiseAnswers.q2.length > 60
                  ? expertiseAnswers.q2.slice(0, 60) + "..."
                  : expertiseAnswers.q2
              }
            />
          )}
        </Section>
      )}
    </div>
  );
}
