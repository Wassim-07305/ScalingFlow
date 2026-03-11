import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { rateLimit } from "@/lib/utils/rate-limit";

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

    const rl = rateLimit(user.id, "generate-logo", { limit: 3, windowSeconds: 120 });
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

    // Build a detailed prompt for logo generation
    const prompt = buildLogoPrompt(brandName, concept, style, colors);

    // Use Flux Schnell (fast, high-quality) via Replicate
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
          num_outputs: 4,
          aspect_ratio: "1:1",
          output_format: "webp",
          output_quality: 90,
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      console.error("[generate-logo] Replicate create error:", err);
      return NextResponse.json(
        { error: "Erreur lors de la creation du job Replicate" },
        { status: 500 }
      );
    }

    const prediction: ReplicateResponse = await createRes.json();

    // Poll for completion (max 60s)
    let result = prediction;
    const pollUrl = prediction.urls?.get || `${REPLICATE_API_URL}/${prediction.id}`;
    const maxAttempts = 30;

    for (let i = 0; i < maxAttempts; i++) {
      if (result.status === "succeeded" || result.status === "failed") break;

      await new Promise((r) => setTimeout(r, 2000));

      const pollRes = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      result = await pollRes.json();
    }

    if (result.status === "failed") {
      return NextResponse.json(
        { error: result.error || "La generation du logo a echoue" },
        { status: 500 }
      );
    }

    if (result.status !== "succeeded" || !result.output) {
      return NextResponse.json(
        { error: "Timeout — la generation prend trop de temps" },
        { status: 504 }
      );
    }

    // output is an array of image URLs
    const images = Array.isArray(result.output) ? result.output : [result.output];

    return NextResponse.json({
      images,
      prompt,
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
  colors?: string[]
): string {
  let prompt = `Professional minimalist logo design for a brand called "${brandName}". `;
  prompt += `Concept: ${concept}. `;

  if (style) {
    prompt += `Style: ${style}. `;
  } else {
    prompt += `Style: modern, clean, professional, tech-forward. `;
  }

  if (colors && colors.length > 0) {
    prompt += `Color palette: ${colors.join(", ")}. `;
  }

  prompt += `The logo should be centered on a clean background, vector-style, suitable for a SaaS/business brand. High contrast, scalable design. No text unless it's the brand name stylized. Professional branding quality.`;

  return prompt;
}
