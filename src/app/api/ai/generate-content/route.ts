import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { contentIdeasPrompt } from "@/lib/ai/prompts/content-ideas";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { market, platform } = body;

    if (!market || !platform) {
      return NextResponse.json(
        { error: "market et platform sont requis" },
        { status: 400 }
      );
    }

    const validPlatforms = [
      "linkedin",
      "instagram",
      "tiktok",
      "youtube",
      "twitter",
      "facebook",
      "blog",
    ];

    if (!validPlatforms.includes(platform.toLowerCase())) {
      return NextResponse.json(
        {
          error: `Plateforme invalide. Plateformes acceptées : ${validPlatforms.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Generate content ideas using AI
    const prompt = contentIdeasPrompt(market, platform);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generatedContent: any = await generateJSON({ prompt, maxTokens: 4096 });

    return NextResponse.json({
      market,
      platform,
      ideas: generatedContent.ideas || [],
    });
  } catch (error) {
    console.error("Error generating content ideas:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération des idées de contenu" },
      { status: 500 }
    );
  }
}
