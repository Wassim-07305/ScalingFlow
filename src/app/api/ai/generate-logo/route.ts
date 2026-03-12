import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { rateLimit } from "@/lib/utils/rate-limit";

export const maxDuration = 300;

const REPLICATE_API_URL = "https://api.replicate.com/v1/predictions";

interface ReplicateResponse {
  id: string;
  status: string;
  output?: string | string[];
  error?: string;
  urls?: { get: string };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const rl = await rateLimit(user.id, "generate-logo", { limit: 3, windowSeconds: 120 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requetes. Reessaie dans 2 minutes." },
        { status: 429 }
      );
    }

    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de generations IA atteinte", usage },
        { status: 403 }
      );
    }

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Generation de logo non configuree (REPLICATE_API_TOKEN manquant)" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { brandName, concept, style, colors } = body;

    if (!brandName || !concept) {
      return NextResponse.json(
        { error: "brandName et concept sont requis" },
        { status: 400 }
      );
    }

    // 3 typed logo variations per CDC spec
    const LOGO_TYPES = [
      { type: "principal", label: "Logo principal", suffix: "full logo with brand name, typography-based or illustration, detailed design" },
      { type: "icone", label: "Logo icone", suffix: "square icon version, minimal, works as favicon or app icon, no text, pure symbol" },
      { type: "monochrome", label: "Logo monochrome", suffix: "black and white version, no colors, suitable for print, clean silhouette" },
    ] as const;

    const results: { type: string; label: string; url: string }[] = [];

    for (const logoType of LOGO_TYPES) {
      const prompt = buildLogoPrompt(brandName, concept, style, colors, logoType.suffix);

      const createRes = await fetch(REPLICATE_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "black-forest-labs/flux-schnell",
          input: {
            prompt,
            num_outputs: 1,
            aspect_ratio: "1:1",
            output_format: "png",
            output_quality: 95,
          },
        }),
      });

      if (!createRes.ok) {
        console.error(`[generate-logo] Replicate error for ${logoType.type}`);
        continue;
      }

      const prediction: ReplicateResponse = await createRes.json();
      let result = prediction;
      const pollUrl = prediction.urls?.get || `${REPLICATE_API_URL}/${prediction.id}`;

      for (let i = 0; i < 30; i++) {
        if (result.status === "succeeded" || result.status === "failed") break;
        await new Promise((r) => setTimeout(r, 2000));
        const pollRes = await fetch(pollUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        result = await pollRes.json();
      }

      if (result.status === "succeeded" && result.output) {
        const url = Array.isArray(result.output) ? result.output[0] : result.output;
        results.push({ type: logoType.type, label: logoType.label, url });
      }
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: "La generation des logos a echoue" },
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
      { error: "Erreur lors de la generation du logo" },
      { status: 500 }
    );
  }
}

function buildLogoPrompt(
  brandName: string,
  concept: string,
  style?: string,
  colors?: string[],
  typeVariation?: string
): string {
  let prompt = `Professional minimalist logo design for a brand called "${brandName}". `;
  prompt += `Concept: ${concept}. `;

  if (typeVariation) {
    prompt += `Variation: ${typeVariation}. `;
  }

  if (style) {
    prompt += `Style: ${style}. `;
  } else {
    prompt += `Style: modern, clean, professional, tech-forward. `;
  }

  if (colors && colors.length > 0 && !typeVariation?.includes("monochrome")) {
    prompt += `Color palette: ${colors.join(", ")}. `;
  }

  prompt += `The logo should be centered on a clean background, vector-style, suitable for a SaaS/business brand. High contrast, scalable design. Professional branding quality. PNG format, 1000x1000px.`;

  return prompt;
}
