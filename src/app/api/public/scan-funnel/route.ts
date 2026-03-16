import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/generate";

// ─── In-memory IP rate limiter (max 5/hour) ──────────────────
const ipCounts = new Map<string, { count: number; resetAt: number }>();

function checkIPRate(ip: string, limit = 5, windowMs = 3600_000): boolean {
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

// ─── Funnel scanning prompt ──────────────────────────────────
function funnelScanPrompt(html: string, url: string): string {
  // Truncate HTML to avoid excessive tokens
  const truncated = html.slice(0, 15000);

  return `Tu es un expert en conversion, copywriting et funnel design.

Analyse cette page web (URL : ${url}) et fournis un audit détaillé.

## HTML de la page (tronqué si trop long)
\`\`\`html
${truncated}
\`\`\`

## Instructions

Analyse les éléments suivants :
1. **Headline** — Est-elle claire, spécifique, orientée bénéfice ?
2. **CTA** — Les call-to-action sont-ils visibles, convaincants, bien placés ?
3. **Structure** — La page suit-elle un framework de conversion (AIDA, PAS, etc.) ?
4. **Éléments de confiance** — Témoignages, garanties, preuves sociales ?

Réponds UNIQUEMENT en JSON valide :
{
  "headline_analysis": {
    "score": <0-100>,
    "found_headline": "<la headline trouvée>",
    "strengths": ["..."],
    "weaknesses": ["..."],
    "suggestions": ["..."]
  },
  "cta_analysis": {
    "score": <0-100>,
    "found_ctas": ["<cta1>", "<cta2>"],
    "strengths": ["..."],
    "weaknesses": ["..."],
    "suggestions": ["..."]
  },
  "structure_score": <0-100>,
  "structure_feedback": ["..."],
  "trust_elements": {
    "found": ["..."],
    "missing": ["..."]
  },
  "overall_score": <0-100>,
  "top_suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;
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

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (!checkIPRate(ip)) {
      return NextResponse.json(
        { error: "Limite atteinte. Maximum 5 scans par heure." },
        { status: 429 },
      );
    }

    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL requise." }, { status: 400 });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json(
        { error: "URL invalide. Utilisez une URL complète (https://...)." },
        { status: 400 },
      );
    }

    // SECURITY: Block SSRF — prevent fetching internal/private network addresses
    const hostname = parsedUrl.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[0-1])\./,
      /^192\.168\./,
      /^0\./,
      /^169\.254\./, // AWS metadata
      /^\[::1\]$/,
      /^\[fd/,
      /^\[fe80:/,
      /^metadata\.google\.internal$/,
      /\.internal$/,
      /\.local$/,
    ];

    if (blockedPatterns.some((p) => p.test(hostname))) {
      return NextResponse.json(
        { error: "URL non autorisée." },
        { status: 400 },
      );
    }

    // Fetch the page HTML
    let html: string;
    try {
      const res = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ScalingFlow/1.0; +https://scalingflow.com)",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `Impossible d'accéder à la page (HTTP ${res.status}).` },
          { status: 422 },
        );
      }

      html = await res.text();
    } catch {
      return NextResponse.json(
        {
          error: "Impossible de charger la page. Vérifiez l'URL et réessayez.",
        },
        { status: 422 },
      );
    }

    if (html.length < 100) {
      return NextResponse.json(
        { error: "La page semble vide ou inaccessible." },
        { status: 422 },
      );
    }

    const result = await generateJSON<FunnelScanResult>({
      prompt: funnelScanPrompt(html, url),
      maxTokens: 4096,
      temperature: 0.5,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Funnel scan error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse. Veuillez réessayer." },
      { status: 500 },
    );
  }
}
