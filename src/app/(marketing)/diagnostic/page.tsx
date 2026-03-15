"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Target,
  Megaphone,
  Truck,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ─── Types ──────────────────────────────────────────────────
interface DiagnosticForm {
  // Step 1: Offre
  offer_name: string;
  offer_description: string;
  offer_price: string;
  offer_guarantee: string;
  // Step 2: Acquisition
  acquisition_channels: string[];
  acquisition_budget: string;
  acquisition_leads_volume: string;
  // Step 3: Delivery
  delivery_method: string;
  delivery_nb_clients: string;
  delivery_satisfaction: string;
  // Step 4: Funnel
  funnel_url: string;
  funnel_headline: string;
  funnel_cta: string;
}

interface DiagnosticResult {
  score_global: number;
  scores: {
    offre: number;
    acquisition: number;
    delivery: number;
    funnel: number;
  };
  recommendations: {
    offre: string[];
    acquisition: string[];
    delivery: string[];
    funnel: string[];
  };
}

interface FunnelScanResult {
  headline_analysis: {
    score: number;
    found_headline: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  cta_analysis: {
    score: number;
    found_ctas: string[];
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  structure_score: number;
  structure_feedback: string[];
  trust_elements: {
    found: string[];
    missing: string[];
  };
  overall_score: number;
  top_suggestions: string[];
}

// ─── Constants ──────────────────────────────────────────────
const ACQUISITION_CHANNELS = [
  "Publicités Meta (Facebook/Instagram)",
  "Google Ads",
  "TikTok Ads",
  "SEO / Contenu organique",
  "Réseaux sociaux (organique)",
  "Email marketing",
  "Prospection (DM / Cold outreach)",
  "Bouche-à-oreille / Referral",
  "YouTube",
  "LinkedIn",
  "Partenariats / Affiliés",
];

const STEPS = [
  { label: "Offre", icon: Target },
  { label: "Acquisition", icon: Megaphone },
  { label: "Delivery", icon: Truck },
  { label: "Funnel", icon: Filter },
];

const DIMENSION_META: Record<
  string,
  { label: string; icon: typeof Target; color: string }
> = {
  offre: { label: "Offre", icon: Target, color: "#34D399" },
  acquisition: { label: "Acquisition", icon: Megaphone, color: "#60A5FA" },
  delivery: { label: "Delivery", icon: Truck, color: "#F59E0B" },
  funnel: { label: "Funnel", icon: Filter, color: "#A78BFA" },
};

// ─── Radar Chart (SVG) ─────────────────────────────────────
function RadarChart({
  scores,
}: {
  scores: { offre: number; acquisition: number; delivery: number; funnel: number };
}) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 110;
  const dims = ["offre", "acquisition", "delivery", "funnel"] as const;
  const labels = ["Offre", "Acquisition", "Delivery", "Funnel"];
  const colors = ["#34D399", "#60A5FA", "#F59E0B", "#A78BFA"];
  const n = dims.length;

  // Get polygon points for a given set of values (0-100)
  const getPoints = (values: number[]) =>
    values
      .map((v, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const r = (v / 100) * maxR;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      })
      .join(" ");

  // Grid rings
  const rings = [25, 50, 75, 100];

  // Axis endpoints
  const axes = dims.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: cx + maxR * Math.cos(angle),
      y: cy + maxR * Math.sin(angle),
    };
  });

  // Label positions (pushed outward)
  const labelPositions = dims.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const labelR = maxR + 28;
    return {
      x: cx + labelR * Math.cos(angle),
      y: cy + labelR * Math.sin(angle),
    };
  });

  const dataPoints = dims.map((d) => scores[d]);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[320px] mx-auto"
    >
      {/* Grid rings */}
      {rings.map((pct) => (
        <polygon
          key={pct}
          points={getPoints(Array(n).fill(pct))}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}

      {/* Axes */}
      {axes.map((a, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={a.x}
          y2={a.y}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}

      {/* Data polygon */}
      <polygon
        points={getPoints(dataPoints)}
        fill="rgba(52,211,153,0.15)"
        stroke="#34D399"
        strokeWidth="2"
      />

      {/* Data dots */}
      {dataPoints.map((v, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const r = (v / 100) * maxR;
        return (
          <circle
            key={i}
            cx={cx + r * Math.cos(angle)}
            cy={cy + r * Math.sin(angle)}
            r="4"
            fill={colors[i]}
            stroke="#0B0E11"
            strokeWidth="2"
          />
        );
      })}

      {/* Labels */}
      {labelPositions.map((pos, i) => (
        <text
          key={i}
          x={pos.x}
          y={pos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-text-secondary text-[11px] font-medium"
        >
          {labels[i]}
        </text>
      ))}
    </svg>
  );
}

// ─── Score Badge ────────────────────────────────────────────
function ScoreBadge({ score, size = "lg" }: { score: number; size?: "sm" | "lg" }) {
  const color =
    score >= 75
      ? "text-accent border-accent/30 bg-accent/5"
      : score >= 50
      ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/5"
      : "text-red-400 border-red-400/30 bg-red-400/5";

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-2xl border font-bold",
        color,
        size === "lg" ? "h-20 w-20 text-2xl" : "h-12 w-12 text-base"
      )}
    >
      {score}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function DiagnosticPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [funnelScan, setFunnelScan] = useState<FunnelScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<DiagnosticForm>({
    offer_name: "",
    offer_description: "",
    offer_price: "",
    offer_guarantee: "",
    acquisition_channels: [],
    acquisition_budget: "",
    acquisition_leads_volume: "",
    delivery_method: "",
    delivery_nb_clients: "",
    delivery_satisfaction: "",
    funnel_url: "",
    funnel_headline: "",
    funnel_cta: "",
  });

  const updateField = <K extends keyof DiagnosticForm>(
    key: K,
    value: DiagnosticForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleChannel = (ch: string) => {
    setForm((prev) => ({
      ...prev,
      acquisition_channels: prev.acquisition_channels.includes(ch)
        ? prev.acquisition_channels.filter((c) => c !== ch)
        : [...prev.acquisition_channels, ch],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'analyse.");
      }
      const data: DiagnosticResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'analyse."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScanFunnel = async () => {
    if (!form.funnel_url) return;
    setScanLoading(true);
    try {
      const res = await fetch("/api/public/scan-funnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.funnel_url }),
      });
      if (res.ok) {
        const data: FunnelScanResult = await res.json();
        setFunnelScan(data);
      }
    } catch {
      // silently fail — scan is optional
    } finally {
      setScanLoading(false);
    }
  };

  const canNext =
    step === 0
      ? form.offer_name.trim() !== "" || form.offer_description.trim() !== ""
      : true;

  // ─── Results view ────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Navbar />

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center relative">
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Résultats de ton Diagnostic
            </h1>
            <p className="text-text-secondary max-w-xl mx-auto">
              Voici l&apos;analyse complète de ton business avec des recommandations actionnables.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 pb-24 space-y-8">
          {/* Global score + radar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Score global */}
            <div className="p-8 rounded-2xl border border-border-default bg-bg-secondary/30 text-center space-y-4">
              <p className="text-sm font-medium text-text-muted uppercase tracking-wider">
                Score Global
              </p>
              <div className="flex justify-center">
                <ScoreBadge score={result.score_global} />
              </div>
              <p className="text-sm text-text-secondary">
                {result.score_global >= 75
                  ? "Excellent ! Ton business a de solides fondations."
                  : result.score_global >= 50
                  ? "Pas mal, mais il y a des axes d'amélioration importants."
                  : "Il y a du travail ! Concentre-toi sur les recommandations ci-dessous."}
              </p>
            </div>

            {/* Radar */}
            <div className="p-6 rounded-2xl border border-border-default bg-bg-secondary/30 flex items-center justify-center">
              <RadarChart scores={result.scores} />
            </div>
          </div>

          {/* Scores par dimension */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(
              Object.keys(DIMENSION_META) as Array<keyof typeof DIMENSION_META>
            ).map((key) => {
              const meta = DIMENSION_META[key];
              const score = result.scores[key as keyof typeof result.scores];
              return (
                <div
                  key={key}
                  className="p-5 rounded-2xl border border-border-default bg-bg-secondary/30 space-y-3 text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <meta.icon
                      className="h-4 w-4"
                      style={{ color: meta.color }}
                    />
                    <span className="text-sm font-medium text-text-primary">
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <ScoreBadge score={score} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommandations */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-text-primary">
              Recommandations
            </h2>
            {(
              Object.keys(DIMENSION_META) as Array<keyof typeof DIMENSION_META>
            ).map((key) => {
              const meta = DIMENSION_META[key];
              const recs =
                result.recommendations[
                  key as keyof typeof result.recommendations
                ] || [];
              const score = result.scores[key as keyof typeof result.scores];
              return (
                <div
                  key={key}
                  className="p-6 rounded-2xl border border-border-default bg-bg-secondary/30 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <meta.icon
                        className="h-5 w-5"
                        style={{ color: meta.color }}
                      />
                      <h3 className="font-semibold text-text-primary">
                        {meta.label}
                      </h3>
                    </div>
                    <ScoreBadge score={score} size="sm" />
                  </div>
                  <ul className="space-y-3">
                    {recs.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3">
                        {score >= 75 ? (
                          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-400" />
                        )}
                        <span className="text-sm text-text-secondary leading-relaxed">
                          {rec}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Funnel scan results */}
          {funnelScan && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-text-primary">
                Audit de ton Funnel
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-border-default bg-bg-secondary/30 text-center space-y-2">
                  <p className="text-xs font-medium text-text-muted uppercase">
                    Headline
                  </p>
                  <ScoreBadge score={funnelScan.headline_analysis.score} size="sm" />
                </div>
                <div className="p-5 rounded-2xl border border-border-default bg-bg-secondary/30 text-center space-y-2">
                  <p className="text-xs font-medium text-text-muted uppercase">
                    CTA
                  </p>
                  <ScoreBadge score={funnelScan.cta_analysis.score} size="sm" />
                </div>
                <div className="p-5 rounded-2xl border border-border-default bg-bg-secondary/30 text-center space-y-2">
                  <p className="text-xs font-medium text-text-muted uppercase">
                    Structure
                  </p>
                  <ScoreBadge score={funnelScan.structure_score} size="sm" />
                </div>
              </div>

              {funnelScan.top_suggestions.length > 0 && (
                <div className="p-6 rounded-2xl border border-border-default bg-bg-secondary/30 space-y-3">
                  <h3 className="font-semibold text-text-primary">
                    Top suggestions
                  </h3>
                  <ul className="space-y-2">
                    {funnelScan.top_suggestions.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm text-text-secondary"
                      >
                        <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="p-8 rounded-2xl border border-accent/20 bg-accent/5 text-center space-y-4">
            <Sparkles className="h-8 w-8 text-accent mx-auto" />
            <h2 className="text-2xl font-bold text-text-primary">
              Prêt à passer à l&apos;action ?
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto">
              ScalingFlow génère automatiquement ton offre, ton funnel, tes ads et tout le contenu
              dont tu as besoin pour scaler. Commence gratuitement.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90 transition-all shadow-[0_0_24px_rgba(52,211,153,0.15)]"
            >
              Créer mon compte gratuitement
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Refaire le diagnostic */}
          <div className="text-center">
            <button
              onClick={() => {
                setResult(null);
                setFunnelScan(null);
                setStep(0);
              }}
              className="text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              Refaire le diagnostic
            </button>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // ─── Form view ───────────────────────────────────
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 pt-16 pb-8 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Gratuit — Aucune inscription requise
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary leading-tight mb-4">
            Diagnostic Business
            <br />
            <span className="text-accent">Gratuit</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Obtiens un score détaillé de ton business en 2 minutes.
            Analyse ton offre, ton acquisition, ta delivery et ton funnel.
          </p>
        </div>
      </section>

      {/* Stepper */}
      <div className="max-w-2xl mx-auto px-4 mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <button
                onClick={() => i <= step && setStep(i)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                  i === step
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : i < step
                    ? "text-accent/60 cursor-pointer"
                    : "text-text-muted cursor-default"
                )}
              >
                <s.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-2",
                    i < step ? "bg-accent/30" : "bg-border-default"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 pb-24">
        <div className="p-6 sm:p-8 rounded-2xl border border-border-default bg-bg-secondary/30 space-y-6">
          {/* Step 1: Offre */}
          {step === 0 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-1">
                  Décris ton offre
                </h2>
                <p className="text-sm text-text-muted">
                  Parle-nous de ce que tu vends.
                </p>
              </div>
              <FieldGroup label="Nom de l'offre">
                <input
                  type="text"
                  value={form.offer_name}
                  onChange={(e) => updateField("offer_name", e.target.value)}
                  placeholder="Ex : Programme Scale & Grow"
                  className="form-input"
                />
              </FieldGroup>
              <FieldGroup label="Description">
                <textarea
                  value={form.offer_description}
                  onChange={(e) =>
                    updateField("offer_description", e.target.value)
                  }
                  placeholder="Décris ce que ton offre inclut, pour qui, et quel résultat elle apporte..."
                  rows={4}
                  className="form-input resize-none"
                />
              </FieldGroup>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="Prix">
                  <input
                    type="text"
                    value={form.offer_price}
                    onChange={(e) => updateField("offer_price", e.target.value)}
                    placeholder="Ex : 2 000 EUR"
                    className="form-input"
                  />
                </FieldGroup>
                <FieldGroup label="Garantie">
                  <input
                    type="text"
                    value={form.offer_guarantee}
                    onChange={(e) =>
                      updateField("offer_guarantee", e.target.value)
                    }
                    placeholder="Ex : Satisfait ou remboursé 30j"
                    className="form-input"
                  />
                </FieldGroup>
              </div>
            </>
          )}

          {/* Step 2: Acquisition */}
          {step === 1 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-1">
                  Acquisition de clients
                </h2>
                <p className="text-sm text-text-muted">
                  Comment attires-tu tes clients ?
                </p>
              </div>
              <FieldGroup label="Canaux utilisés">
                <div className="flex flex-wrap gap-2">
                  {ACQUISITION_CHANNELS.map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChannel(ch)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        form.acquisition_channels.includes(ch)
                          ? "border-accent/50 bg-accent/10 text-accent"
                          : "border-border-default text-text-muted hover:text-text-secondary hover:border-border-hover"
                      )}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </FieldGroup>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="Budget mensuel acquisition">
                  <input
                    type="text"
                    value={form.acquisition_budget}
                    onChange={(e) =>
                      updateField("acquisition_budget", e.target.value)
                    }
                    placeholder="Ex : 3 000 EUR/mois"
                    className="form-input"
                  />
                </FieldGroup>
                <FieldGroup label="Volume de leads/mois">
                  <input
                    type="text"
                    value={form.acquisition_leads_volume}
                    onChange={(e) =>
                      updateField("acquisition_leads_volume", e.target.value)
                    }
                    placeholder="Ex : 150 leads/mois"
                    className="form-input"
                  />
                </FieldGroup>
              </div>
            </>
          )}

          {/* Step 3: Delivery */}
          {step === 2 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-1">
                  Delivery & Satisfaction
                </h2>
                <p className="text-sm text-text-muted">
                  Comment livres-tu ta prestation ?
                </p>
              </div>
              <FieldGroup label="Mode de livraison">
                <textarea
                  value={form.delivery_method}
                  onChange={(e) =>
                    updateField("delivery_method", e.target.value)
                  }
                  placeholder="Ex : Coaching 1:1, cours en ligne, mastermind, done-for-you..."
                  rows={3}
                  className="form-input resize-none"
                />
              </FieldGroup>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="Nombre de clients actifs">
                  <input
                    type="text"
                    value={form.delivery_nb_clients}
                    onChange={(e) =>
                      updateField("delivery_nb_clients", e.target.value)
                    }
                    placeholder="Ex : 25 clients"
                    className="form-input"
                  />
                </FieldGroup>
                <FieldGroup label="Satisfaction client">
                  <input
                    type="text"
                    value={form.delivery_satisfaction}
                    onChange={(e) =>
                      updateField("delivery_satisfaction", e.target.value)
                    }
                    placeholder="Ex : 9/10, très satisfaits"
                    className="form-input"
                  />
                </FieldGroup>
              </div>
            </>
          )}

          {/* Step 4: Funnel */}
          {step === 3 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-1">
                  Funnel & Conversion
                </h2>
                <p className="text-sm text-text-muted">
                  As-tu un funnel en place ?
                </p>
              </div>
              <FieldGroup label="URL du funnel (optionnel)">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.funnel_url}
                    onChange={(e) => updateField("funnel_url", e.target.value)}
                    placeholder="https://ton-site.com/offre"
                    className="form-input flex-1"
                  />
                  {form.funnel_url && (
                    <button
                      type="button"
                      onClick={handleScanFunnel}
                      disabled={scanLoading}
                      className="shrink-0 px-3 py-2 rounded-lg border border-accent/30 bg-accent/5 text-accent text-sm font-medium hover:bg-accent/10 transition-colors disabled:opacity-50"
                    >
                      {scanLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5" />
                          Scanner
                        </div>
                      )}
                    </button>
                  )}
                </div>
                {funnelScan && (
                  <p className="text-xs text-accent mt-1">
                    Funnel scanné avec succès (score : {funnelScan.overall_score}/100)
                  </p>
                )}
              </FieldGroup>
              <FieldGroup label="Headline principale">
                <input
                  type="text"
                  value={form.funnel_headline}
                  onChange={(e) =>
                    updateField("funnel_headline", e.target.value)
                  }
                  placeholder="Ex : Double tes revenus en 90 jours"
                  className="form-input"
                />
              </FieldGroup>
              <FieldGroup label="CTA principal">
                <input
                  type="text"
                  value={form.funnel_cta}
                  onChange={(e) => updateField("funnel_cta", e.target.value)}
                  placeholder="Ex : Réserve ton appel stratégique"
                  className="form-input"
                />
              </FieldGroup>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            {step > 0 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Précédent
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Suivant
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Lancer le diagnostic
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// ─── Shared components ─────────────────────────────────────
function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary">
        {label}
      </label>
      {children}
    </div>
  );
}

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border-default/50 bg-bg-primary/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/welcome" className="flex items-center gap-3">
          <Image
            src="/icons/icon-192.png"
            alt="ScalingFlow"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-lg font-bold text-text-primary">
            ScalingFlow
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Commencer
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border-default/50">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image
            src="/icons/icon-192.png"
            alt="ScalingFlow"
            width={24}
            height={24}
            className="rounded-md"
          />
          <span className="text-sm font-medium text-text-secondary">
            ScalingFlow
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs text-text-muted">
          <Link
            href="/login"
            className="hover:text-text-secondary transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="hover:text-text-secondary transition-colors"
          >
            Inscription
          </Link>
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Paiements sécurisés via Stripe
          </div>
        </div>
      </div>
    </footer>
  );
}
