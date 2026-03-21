import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration } from "@/lib/ai/model-router";
import { rateLimit } from "@/lib/utils/rate-limit";
import { getSetting } from "@/lib/settings/get-setting";

export const maxDuration = 300;

const REPLICATE_MODEL = "black-forest-labs/flux-1.1-pro";
const REPLICATE_API_URL = `https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`;

interface ReplicateResponse {
  id: string;
  status: string;
  output?: string | string[];
  error?: string;
  urls?: { get: string };
}

const FORMAT_CONFIG = {
  feed: {
    aspect_ratio: "1:1",
    label: "Feed 1080×1080",
    width: 1080,
    height: 1080,
  },
  story: {
    aspect_ratio: "9:16",
    label: "Story 1080×1920",
    width: 1080,
    height: 1920,
  },
  facebook: {
    aspect_ratio: "16:9",
    label: "Facebook 1200×628",
    width: 1200,
    height: 628,
  },
} as const;

type AdFormat = keyof typeof FORMAT_CONFIG;
type AdStyle = "minimal" | "bold" | "elegant";

const STYLE_DESCRIPTIONS: Record<AdStyle, string> = {
  minimal:
    "Clean minimalist design with generous whitespace, subtle typography, muted tones, and simple geometric shapes. Modern and sleek.",
  bold: "Bold and eye-catching design with strong contrast, large impactful typography, vibrant saturated colors, dynamic composition. High energy.",
  elegant:
    "Sophisticated elegant design with refined serif typography, luxury feel, subtle gradients, premium textures, gold or metallic accents.",
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const rl = await rateLimit(user.id, "generate-ad-images", {
      limit: 5,
      windowSeconds: 120,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessaie dans 2 minutes." },
        { status: 429 },
      );
    }

    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de générations IA atteinte", usage },
        { status: 403 },
      );
    }

    const token = await getSetting("REPLICATE_API_TOKEN");
    if (!token) {
      return NextResponse.json(
        {
          error:
            "Génération d'images non configurée (REPLICATE_API_TOKEN manquant)",
        },
        { status: 500 },
      );
    }

    const body = await req.json();
    const {
      ad_text,
      brand_colors,
      brand_name,
      format,
      style,
      num_variations,
    }: {
      ad_text: { headline: string; body: string };
      brand_colors: string[];
      brand_name: string;
      format: AdFormat;
      style: AdStyle;
      num_variations?: number;
    } = body;

    if (!ad_text?.headline || !format) {
      return NextResponse.json(
        { error: "ad_text.headline et format sont requis" },
        { status: 400 },
      );
    }

    const formatConfig = FORMAT_CONFIG[format];
    if (!formatConfig) {
      return NextResponse.json(
        { error: "Format invalide. Utilise: feed, story ou facebook" },
        { status: 400 },
      );
    }

    const styleDesc = STYLE_DESCRIPTIONS[style] || STYLE_DESCRIPTIONS.minimal;

    // Generate 3-5 variations with different visual approaches
    const ALL_VARIATIONS = [
      {
        suffix:
          "Product showcase composition with text headline area at top, clean background gradient, professional marketing layout",
      },
      {
        suffix:
          "Abstract geometric background pattern, bold shapes, text overlay area centered, social media advertising style",
      },
      {
        suffix:
          "Lifestyle scene with blurred background, prominent headline text space, modern digital marketing aesthetic",
      },
      {
        suffix:
          "Split composition with contrasting halves, dynamic diagonal divider, attention-grabbing visual balance",
      },
      {
        suffix:
          "Flat lay overhead perspective, organized objects arrangement, testimonial-style layout with space for text",
      },
    ];

    const variationCount = Math.min(Math.max(num_variations || 3, 1), 5);
    const VARIATIONS = ALL_VARIATIONS.slice(0, variationCount);

    const results: { url: string; variation: number }[] = [];

    for (let i = 0; i < VARIATIONS.length; i++) {
      // Wait between variations to avoid Replicate rate limiting (burst=1 under $5 credit)
      if (i > 0) await new Promise((r) => setTimeout(r, 8000));

      const variation = VARIATIONS[i];
      const prompt = buildAdImagePrompt(
        ad_text,
        brand_colors,
        brand_name,
        styleDesc,
        formatConfig,
        variation.suffix,
      );

      const createRes = await fetch(REPLICATE_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            prompt,
            num_outputs: 1,
            aspect_ratio: formatConfig.aspect_ratio,
            output_format: "png",
            output_quality: 95,
          },
        }),
      });

      if (!createRes.ok) {
        const errBody = await createRes.text().catch(() => "");
        console.error(
          `[generate-ad-images] Replicate error for variation ${i + 1}: HTTP ${createRes.status} — ${errBody.slice(0, 500)}`,
        );
        continue;
      }

      const prediction: ReplicateResponse = await createRes.json();
      let result = prediction;
      const pollUrl =
        prediction.urls?.get || `${REPLICATE_API_URL}/${prediction.id}`;

      for (let attempt = 0; attempt < 30; attempt++) {
        if (result.status === "succeeded" || result.status === "failed") break;
        await new Promise((r) => setTimeout(r, 2000));
        const pollRes = await fetch(pollUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        result = await pollRes.json();
      }

      if (result.status === "succeeded" && result.output) {
        const url = Array.isArray(result.output)
          ? result.output[0]
          : result.output;
        results.push({ url, variation: i + 1 });
      }
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: "La génération des images a échoué. Vérifie que le token Replicate est valide dans les paramètres admin." },
        { status: 500 },
      );
    }

    const aiModel = getModelForGeneration("ad_images");
    incrementAIUsage(user.id, { generationType: "ad_images", model: aiModel }).catch(() => {});

    return NextResponse.json({
      images: results,
      format,
      style,
      brand_name,
    });
  } catch (error) {
    console.error("[generate-ad-images] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération des images publicitaires" },
      { status: 500 },
    );
  }
}

function inferSceneFromContent(headline: string, body: string): string {
  const text = `${headline} ${body}`.toLowerCase();

  // Tech / dev / code
  if (/dev|code|program|tech|saas|app|logiciel|software|api|web|digital/.test(text)) {
    return "Modern tech workspace with glowing screens, code editor on monitor, dark ambient lighting, neon accents, futuristic developer setup";
  }
  // IA / automation
  if (/ia\b|ai\b|intelligen|automat|machine|robot|chatbot|claude|gpt/.test(text)) {
    return "Abstract AI neural network visualization, glowing nodes and connections, futuristic digital brain, dark background with blue and purple light trails";
  }
  // Marketing / ads / growth
  if (/market|pub|ads|growth|scale|croiss|acqui|lead|funnel|conversion/.test(text)) {
    return "Dynamic upward trending graph with glowing data points, marketing dashboard on screen, modern office with city view at night";
  }
  // Business / entrepreneur / coaching
  if (/business|entrepreneur|coach|mentor|consult|freelance|indépen/.test(text)) {
    return "Confident professional in modern minimalist office, warm golden hour lighting, clean desk with laptop, success and ambition atmosphere";
  }
  // Formation / cours / apprendre
  if (/forma|cours|learn|appren|éduca|certif|compéten|skill|boost/.test(text)) {
    return "Modern e-learning setup with tablet and laptop showing course interface, notebook and coffee, warm study environment with bokeh lights";
  }
  // Finance / argent / revenu
  if (/argent|revenu|€|euro|money|profit|chiffre|salaire|freelan|client/.test(text)) {
    return "Luxurious modern workspace, premium laptop, financial charts on screen, warm ambient lighting, wealth and success atmosphere";
  }
  // Fitness / santé / bien-être
  if (/fitness|santé|sport|yoga|bien.?être|nutrition|perte|muscl/.test(text)) {
    return "Energetic fitness scene, athletic environment with warm natural light, health and vitality atmosphere, clean modern gym";
  }
  // Default: abstract professional
  return "Abstract gradient background with soft geometric shapes, professional and modern atmosphere, clean composition with depth of field";
}

function buildAdImagePrompt(
  adText: { headline: string; body: string },
  brandColors: string[],
  brandName: string,
  styleDesc: string,
  formatConfig: { label: string; width: number; height: number },
  variationSuffix: string,
): string {
  const scene = inferSceneFromContent(adText.headline, adText.body || "");

  let prompt = `${scene}. `;
  prompt += `${styleDesc} `;
  prompt += `${variationSuffix}. `;

  if (brandColors && brandColors.length > 0) {
    prompt += `Dominant color palette: ${brandColors.join(", ")}. `;
  }

  prompt += `Aspect ratio: ${formatConfig.width}x${formatConfig.height}. `;
  prompt += `This is a background visual for a social media advertisement. `;
  prompt += `CRITICAL: Do NOT render any text, letters, words, numbers, logos, watermarks, or typography in the image. The image must contain ZERO text of any kind. Only visual elements, textures, lighting, and scenery. `;
  prompt += `Ultra high quality, 4K, professional photography, cinematic lighting, sharp focus.`;

  return prompt;
}
