import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/generate";

export const maxDuration = 60;

// ─── In-memory IP rate limiter (max 3/hour) ──────────────────
const ipCounts = new Map<string, { count: number; resetAt: number }>();

function checkIPRate(ip: string, limit = 3, windowMs = 3600_000): boolean {
  const now = Date.now();
  const entry = ipCounts.get(ip);

  if (!entry || entry.resetAt <= now) {
    ipCounts.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// ─── Diagnostic scoring prompt ───────────────────────────────
function diagnosticPrompt(data: DiagnosticInput): string {
  return `Tu es un expert en business consulting, marketing digital et scaling d'entreprises.

On te fournit les informations d'un business. Tu dois analyser chaque dimension et attribuer un score /100.

## Informations du business

### Offre
- Nom : ${data.offer_name || "Non précisé"}
- Description : ${data.offer_description || "Non précisé"}
- Prix : ${data.offer_price || "Non précisé"}
- Garantie : ${data.offer_guarantee || "Non précisée"}

### Acquisition
- Canaux utilisés : ${data.acquisition_channels?.join(", ") || "Non précisé"}
- Budget mensuel : ${data.acquisition_budget || "Non précisé"}
- Volume de leads/mois : ${data.acquisition_leads_volume || "Non précisé"}

### Delivery
- Mode de livraison : ${data.delivery_method || "Non précisé"}
- Nombre de clients actifs : ${data.delivery_nb_clients || "Non précisé"}
- Satisfaction client : ${data.delivery_satisfaction || "Non précisé"}

### Funnel
- URL du funnel : ${data.funnel_url || "Pas de funnel"}
- Headline principale : ${data.funnel_headline || "Non précisé"}
- CTA principal : ${data.funnel_cta || "Non précisé"}

## Instructions

Analyse chaque dimension et donne :
1. Un score global /100 (moyenne pondérée)
2. Un score /100 pour chaque dimension : Offre, Acquisition, Delivery, Funnel
3. 2-3 recommandations concrètes et actionnables par dimension

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "score_global": <number 0-100>,
  "scores": {
    "offre": <number 0-100>,
    "acquisition": <number 0-100>,
    "delivery": <number 0-100>,
    "funnel": <number 0-100>
  },
  "recommendations": {
    "offre": ["rec1", "rec2", "rec3"],
    "acquisition": ["rec1", "rec2", "rec3"],
    "delivery": ["rec1", "rec2", "rec3"],
    "funnel": ["rec1", "rec2", "rec3"]
  }
}`;
}

interface DiagnosticInput {
  offer_name?: string;
  offer_description?: string;
  offer_price?: string;
  offer_guarantee?: string;
  acquisition_channels?: string[];
  acquisition_budget?: string;
  acquisition_leads_volume?: string;
  delivery_method?: string;
  delivery_nb_clients?: string;
  delivery_satisfaction?: string;
  funnel_url?: string;
  funnel_headline?: string;
  funnel_cta?: string;
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

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (!checkIPRate(ip)) {
      return NextResponse.json(
        { error: "Limite atteinte. Maximum 3 diagnostics par heure." },
        { status: 429 },
      );
    }

    const body: DiagnosticInput = await req.json();

    // Basic validation
    if (!body.offer_name && !body.offer_description) {
      return NextResponse.json(
        { error: "Veuillez décrire votre offre." },
        { status: 400 },
      );
    }

    const result = await generateJSON<DiagnosticResult>({
      prompt: diagnosticPrompt(body),
      maxTokens: 4096,
      temperature: 0.6,
    });

    // Clamp scores to 0-100
    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
    result.score_global = clamp(result.score_global);
    result.scores.offre = clamp(result.scores.offre);
    result.scores.acquisition = clamp(result.scores.acquisition);
    result.scores.delivery = clamp(result.scores.delivery);
    result.scores.funnel = clamp(result.scores.funnel);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Diagnostic error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse. Veuillez réessayer." },
      { status: 500 },
    );
  }
}
