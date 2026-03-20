import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { hasFeatureAccess, getMinPlanForFeature } from "@/lib/stripe/feature-access";
import { createClient } from "@/lib/supabase/server";
import { createStreamingResponse, streamText } from "@/lib/ai/generate";
import {
  getAgent,
  type AgentType,
  type AgentDefinition,
} from "@/lib/ai/agents/index";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import { buildRAGContext } from "@/lib/ai/rag";
import { rateLimit } from "@/lib/utils/rate-limit";
import { SupabaseClient } from "@supabase/supabase-js";

// ─── Domain-specific context fetchers ────────────────────────

async function fetchAgentContext(
  supabase: SupabaseClient,
  userId: string,
  agent: AgentDefinition,
): Promise<string> {
  const blocks: string[] = [];
  const tables = agent.contextTables;

  if (tables.includes("market")) {
    const { data } = await supabase
      .from("market_analyses")
      .select(
        "market_name, market_description, problems, opportunities, viability_score, recommended_positioning, schwartz_level, schwartz_analysis, persona",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (data) {
      const problems = Array.isArray(data.problems)
        ? data.problems.join(", ")
        : "N/A";
      const opportunities = Array.isArray(data.opportunities)
        ? data.opportunities.join(", ")
        : "N/A";
      blocks.push(
        `## Analyse de marché\n- Marché : ${data.market_name || "N/A"}\n- Description : ${data.market_description || "N/A"}\n- Problèmes identifiés : ${problems}\n- Opportunités : ${opportunities}\n- Score de viabilité : ${data.viability_score || "N/A"}/100\n- Positionnement recommandé : ${data.recommended_positioning || "N/A"}\n- Niveau Schwartz : ${data.schwartz_level || "N/A"}`,
      );
      if (data.persona && typeof data.persona === "object") {
        blocks.push(
          `## Avatar client (ICP)\n${JSON.stringify(data.persona, null, 2).slice(0, 2000)}`,
        );
      }
    }
  }

  if (tables.includes("competitors")) {
    const { data } = await supabase
      .from("market_analyses")
      .select("competitors, competitor_analysis")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (data?.competitors) {
      blocks.push(
        `## Concurrents identifiés\n${JSON.stringify(data.competitors, null, 2).slice(0, 2000)}`,
      );
    }
    if (data?.competitor_analysis) {
      blocks.push(
        `## Analyse concurrentielle\n${JSON.stringify(data.competitor_analysis, null, 2).slice(0, 2000)}`,
      );
    }
  }

  if (tables.includes("funnel")) {
    const { data } = await supabase
      .from("funnels")
      .select(
        "funnel_name, status, optin_page, vsl_page, total_visits, total_optins, conversion_rate",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (data) {
      blocks.push(
        `## Dernier funnel\n- Nom : ${data.funnel_name || "N/A"}\n- Statut : ${data.status || "N/A"}\n- Visites : ${data.total_visits || 0}\n- Optins : ${data.total_optins || 0}\n- Taux conversion : ${((data.conversion_rate || 0) * 100).toFixed(1)}%`,
      );
    }
  }

  if (tables.includes("ads")) {
    const { data } = await supabase
      .from("ad_creatives")
      .select(
        "creative_type, hook, headline, ad_copy, target_audience, angle, ctr, spend, conversions",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);
    if (data && data.length > 0) {
      const adLines = data.map(
        (a, i) =>
          `${i + 1}. [${a.creative_type || "ad"}] Hook: "${a.hook || "N/A"}" — Headline: "${a.headline || "N/A"}" — Audience: ${a.target_audience || "N/A"} — Angle: ${a.angle || "N/A"}`,
      );
      blocks.push(
        `## Dernières créatives publicitaires\n${adLines.join("\n")}`,
      );
    }
  }

  if (tables.includes("content")) {
    const { data } = await supabase
      .from("content_pieces")
      .select("content_type, title, hook")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (data && data.length > 0) {
      const contentLines = data.map(
        (c, i) =>
          `${i + 1}. [${c.content_type || ""}] ${c.title || "Sans titre"}${c.hook ? ` — Hook: "${c.hook}"` : ""}`,
      );
      blocks.push(`## Derniers contenus créés\n${contentLines.join("\n")}`);
    }
  }

  return blocks.length > 0 ? "\n" + blocks.join("\n\n") : "";
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
      });
    }

    // Rate limiting
    const rl = await rateLimit(user.id, "chat", {
      limit: 10,
      windowSeconds: 60,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessaie dans quelques secondes." },
        { status: 429 },
      );
    }

    // Check AI usage limits
    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de générations IA atteinte", usage },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { message, agentType, conversationId } = body as {
      message: string;
      agentType: AgentType;
      conversationId?: string;
    };

    if (!message) {
      return new Response(JSON.stringify({ error: "Message requis" }), {
        status: 400,
      });
    }

    const agent = getAgent(agentType || "general");

    // Check agent access — free plan can only use "general" agent
    if (agentType && agentType !== "general") {
      const canUseAgents = await hasFeatureAccess(user.id, "specialized_agents");
      if (!canUseAgents) {
        const minPlan = getMinPlanForFeature("specialized_agents");
        return NextResponse.json(
          {
            error: `L'agent "${agent.name}" est disponible à partir du plan ${minPlan.charAt(0).toUpperCase() + minPlan.slice(1)}. Upgrade ton plan pour y accéder.`,
            upgradeRequired: true,
            minPlan,
          },
          { status: 403 },
        );
      }
    }

    // Fetch full vault context (profile + resources), latest offer, agent-specific context, and RAG context
    const [vaultContext, { data: latestOffer }, agentContext, ragContext] =
      await Promise.all([
        buildFullVaultContext(user.id),
        supabase
          .from("offers")
          .select("offer_name, positioning, unique_mechanism")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        fetchAgentContext(supabase, user.id, agent),
        buildRAGContext(user.id, message).catch(() => ""),
      ]);

    const offerBlock = latestOffer
      ? `\n## Dernière offre\n- Nom : ${latestOffer.offer_name}\n- Positionnement : ${latestOffer.positioning || "Non défini"}\n- Mecanisme unique : ${latestOffer.unique_mechanism || "Non défini"}\n`
      : "";

    // Inject whitelabel owner's vault knowledge if enabled
    let ownerVaultBlock = "";
    try {
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id, organizations(owner_id, custom_prompts)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      const orgsRaw = membership?.organizations;
      const org = (
        Array.isArray(orgsRaw) ? orgsRaw[0] : orgsRaw
      ) as { owner_id: string; custom_prompts: Record<string, unknown> } | null;
      if (
        org?.custom_prompts?.vault_knowledge_enabled !== false &&
        org?.owner_id &&
        org.owner_id !== user.id
      ) {
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("vault_extraction")
          .eq("id", org.owner_id)
          .single();
        if (ownerProfile?.vault_extraction) {
          ownerVaultBlock = `\n\n## Expertise de ton coach (à utiliser pour personnaliser tes réponses)\n${JSON.stringify(ownerProfile.vault_extraction, null, 2).slice(0, 4000)}`;
        }
      }
    } catch {
      // Non-blocking — ignore whitelabel context errors
    }

    const fullSystemPrompt = `${agent.systemPrompt}\n\n${vaultContext}${offerBlock}${agentContext}${ragContext}${ownerVaultBlock}`;

    // Load previous messages if conversation exists
    let previousMessages: { role: string; content: string }[] = [];
    if (conversationId) {
      const { data: conversation } = await supabase
        .from("agent_conversations")
        .select("messages")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single();

      if (conversation?.messages) {
        previousMessages = conversation.messages as {
          role: string;
          content: string;
        }[];
      }
    }

    // Build full prompt with history
    const historyBlock =
      previousMessages.length > 0
        ? previousMessages
            .slice(-10) // Keep last 10 messages for context
            .map(
              (m) =>
                `${m.role === "user" ? "Utilisateur" : "Assistant"}: ${m.content}`,
            )
            .join("\n\n")
        : "";

    const userPrompt = historyBlock
      ? `Historique de la conversation:\n${historyBlock}\n\nUtilisateur: ${message}`
      : message;

    // Stream the response
    const stream = streamText({
      prompt: userPrompt,
      systemPrompt: fullSystemPrompt,
      maxTokens: 4096,
    });

    incrementAIUsage(user.id, { generationType: "agent_chat", model: "haiku" }).catch(() => {});

    return new Response(createStreamingResponse(stream), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erreur lors de la génération" }),
      { status: 500 },
    );
  }
}
