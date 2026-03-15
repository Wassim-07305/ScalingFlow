import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { businessAuditPrompt, type BusinessAuditContext, type BusinessAuditResult } from "@/lib/ai/prompts/business-audit";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import { rateLimit } from "@/lib/utils/rate-limit";

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

    // Rate limiting
    const rl = await rateLimit(user.id, "audit-business", { limit: 5, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessaie dans quelques secondes." },
        { status: 429 }
      );
    }

    // Check AI usage limits
    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de générations IA atteinte", usage },
        { status: 403 }
      );
    }

    const body: BusinessAuditContext = await req.json();

    const vaultContext = await buildFullVaultContext(user.id);
    const basePrompt = businessAuditPrompt(body);

    const result = await generateJSON<BusinessAuditResult>({
      prompt: vaultContext ? basePrompt + "\n" + vaultContext : basePrompt,
      maxTokens: 8192,
      temperature: 0.7,
    });

    // Award XP (non-blocking)
    try { await awardXP(user.id, "generation.business_audit"); } catch {}
    try { await notifyGeneration(user.id, "generation.business_audit"); } catch {}

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur audit : ${message}` },
      { status: 500 }
    );
  }
}
