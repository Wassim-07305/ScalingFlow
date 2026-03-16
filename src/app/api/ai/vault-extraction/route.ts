import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/generate";
import { awardXP } from "@/lib/gamification/xp-engine";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { answers } = await req.json();

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Réponses requises" }, { status: 400 });
    }

    // Get user profile for context
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills, situation, experience_level, industries")
      .eq("id", user.id)
      .single();

    const prompt = `Tu es un expert en extraction et structuration d'expertise professionnelle.

## Profil de l'utilisateur
- Competences : ${(profile?.skills as string[])?.join(", ") || "Non renseignees"}
- Situation : ${profile?.situation || "Non renseignee"}
- Niveau : ${profile?.experience_level || "Non renseigne"}
- Industries : ${(profile?.industries as string[])?.join(", ") || "Non renseignees"}

## Reponses au questionnaire d'extraction
${answers.map((a: { question: string; answer: string }) => `**Q: ${a.question}**\nR: ${a.answer}`).join("\n\n")}

## Ta mission
A partir de ces réponses, crée un document d'expertise structuré et actionnable qui servira de base pour toutes les générations IA futures (offres, ads, contenu, scripts).

Structure ton document avec ces sections :
1. **Resume de l'expertise** (2-3 phrases percutantes)
2. **Problème principal résolu** (avec contexte marché)
3. **Methodologie unique** (process step-by-step)
4. **Preuves et resultats** (chiffres cles, temoignages)
5. **Differenciateurs cles** (ce qui rend cette expertise unique)
6. **Erreurs courantes du marche** (que l'expert corrige)
7. **Moment de transformation** (le "declic" client)
8. **Arsenal d'outils et frameworks** (outils uniques utilises)
9. **Parcours de legitimite** (pourquoi cet expert est credible)
10. **Argument de conversion ultime** (pour convaincre un prospect hesitant)

Redige en francais, de maniere claire et structuree. Utilise des bullet points et des sous-sections pour faciliter la lecture.`;

    const extraction = await generateText({ prompt, maxTokens: 4096 });

    // Save to profile
    await supabase
      .from("profiles")
      .update({ vault_extraction: extraction })
      .eq("id", user.id);

    try {
      await awardXP(user.id, "generation.vault_analysis");
    } catch {
      /* ignore xp errors */
    }

    return NextResponse.json({ extraction });
  } catch (error) {
    console.error("Vault extraction error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'extraction" },
      { status: 500 },
    );
  }
}
