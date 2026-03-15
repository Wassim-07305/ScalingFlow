import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { generateText } from "@/lib/ai/generate";
import { rateLimit } from "@/lib/utils/rate-limit";

export const maxDuration = 120;

const LOGO_TYPES = [
  {
    type: "principal",
    label: "Logo principal",
    instruction: "Logo complet avec le nom de la marque intégré. Design typographique ou combiné (symbole + texte). Utilise les couleurs de la palette.",
  },
  {
    type: "icone",
    label: "Logo icône",
    instruction: "Version icône carrée, minimaliste, sans texte. Doit fonctionner comme favicon ou icône d'app. Symbole pur, géométrique.",
  },
  {
    type: "monochrome",
    label: "Logo monochrome",
    instruction: "Version noir et blanc uniquement (#000 sur fond transparent). Pas de couleurs. Silhouette épurée adaptée à l'impression.",
  },
] as const;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const rl = await rateLimit(user.id, "generate-logo", { limit: 3, windowSeconds: 120 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessaie dans 2 minutes." },
        { status: 429 }
      );
    }

    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de générations IA atteinte", usage },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { brandName, concept, style, colors } = body as {
      brandName?: string;
      concept?: string;
      style?: string;
      colors?: string[];
    };

    if (!brandName || !concept) {
      return NextResponse.json(
        { error: "brandName et concept sont requis" },
        { status: 400 }
      );
    }

    const results: { type: string; label: string; url: string }[] = [];

    for (const logoType of LOGO_TYPES) {
      try {
        const svgCode = await generateText({
          prompt: buildSVGPrompt(brandName, concept, style, colors, logoType.instruction),
          maxTokens: 4096,
          temperature: 0.8,
        });

        // Extract SVG from response
        const svgMatch = svgCode.match(/<svg[\s\S]*?<\/svg>/i);
        if (!svgMatch) continue;

        const svg = svgMatch[0];
        const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
        results.push({ type: logoType.type, label: logoType.label, url: dataUrl });
      } catch (err) {
        console.error(`[generate-logo] Erreur pour ${logoType.type}:`, err);
      }
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: "La génération des logos a échoué" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      images: results.map((r) => r.url),
      logos: results,
      brandName,
    });
  } catch (error) {
    console.error("[generate-logo] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du logo" },
      { status: 500 }
    );
  }
}

function buildSVGPrompt(
  brandName: string,
  concept: string,
  style?: string,
  colors?: string[],
  typeInstruction?: string
): string {
  const colorInfo = colors && colors.length > 0
    ? `Palette de couleurs à utiliser : ${colors.join(", ")}.`
    : "Utilise des couleurs modernes et professionnelles.";

  return `Tu es un designer de logos expert. Génère un logo SVG professionnel.

## MARQUE
- Nom : ${brandName}
- Concept : ${concept}
${style ? `- Style : ${style}` : "- Style : moderne, épuré, professionnel"}
- ${colorInfo}

## TYPE DE VARIATION
${typeInstruction || "Logo principal avec le nom de la marque."}

## CONTRAINTES SVG
- Viewbox : 0 0 200 200
- Utilise uniquement des éléments SVG natifs (path, circle, rect, text, g, polygon, line, ellipse)
- Le texte doit utiliser des polices web-safe (Arial, Helvetica, sans-serif)
- Design centré dans le viewbox
- Pas de xmlns redondants, pas de commentaires
- Le logo doit être professionnel, minimaliste et mémorisable
- Adapté pour une marque SaaS/business

Réponds UNIQUEMENT avec le code SVG, rien d'autre. Commence par <svg et termine par </svg>.`;
}
