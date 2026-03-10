import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { createClient } from "@/lib/supabase/server";
import { createStreamingResponse, streamText } from "@/lib/ai/generate";
import { getAgent, type AgentType, type AgentDefinition } from "@/lib/ai/agents/index";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import { buildRAGContext } from "@/lib/ai/rag";
import { SupabaseClient } from "@supabase/supabase-js";

// ─── Domain-specific context fetchers ────────────────────────

async function fetchAgentContext(
  supabase: SupabaseClient,
  userId: string,
  agent: AgentDefinition
): Promise<string> {
  const blocks: string[] = [];
  const tables = agent.contextTables;

  // "profile" and "offer" are already handled by vault + offer block
  // Fetch additional domain data based on contextTables

  if (tables.includes("market")) {
    const { data } = await supabase
      .from("market_analyses")
      .select("market_name, target_audience, pain_points, sophistication_level, market_size")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (data) {
      blocks.push(
        `## Analyse de marché\n- Marché : ${data.market_name || "N/A"}\n- Audience cible : ${data.target_audience || "N/A"}\n- Douleurs : ${data.pain_points || "N/A"}\n- Niveau de sophistication : ${data.sophistication_level || "N/A"}\n- Taille du marché : ${data.market_size || "N/A"}`
      );
    }
  }

  if (tables.includes("competitors")) {
    const { data } = await supabase
      .from("market_analyses")
      .select("competitors")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (data?.competitors) {
      blocks.push(`## Concurrents identifiés\n${JSON.stringify(data.competitors, null, 2)}`);
    }
  }

  if (tables.includes("funnel")) {
    const { data } = await supabase
      .from("funnels")
      .select("funnel_type, headline, sub_headline, cta_text, vsl_script")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (data) {
      blocks.push(
        `## Dernier funnel\n- Type : ${data.funnel_type || "N/A"}\n- Headline : ${data.headline || "N/A"}\n- Sous-headline : ${data.sub_headline || "N/A"}\n- CTA : ${data.cta_text || "N/A"}${data.vsl_script ? `\n- Script VSL : (disponible)` : ""}`
      );
    }
  }

  if (tables.includes("ads")) {
    const { data } = await supabase
      .from("ad_creatives")
      .select("hook, primary_text, ad_type, target_audience")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);
    if (data && data.length > 0) {
      const adLines = data.map(
        (a, i) => `${i + 1}. [${a.ad_type || "ad"}] Hook: "${a.hook || "N/A"}" — Audience: ${a.target_audience || "N/A"}`
      );
      blocks.push(`## Dernières publicités\n${adLines.join("\n")}`);
    }
  }

  if (tables.includes("content")) {
    const { data } = await supabase
      .from("content_pieces")
      .select("content_type, title, platform")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (data && data.length > 0) {
      const contentLines = data.map(
        (c, i) => `${i + 1}. [${c.platform || ""}] ${c.content_type || ""} — ${c.title || "Sans titre"}`
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
    // Check AI usage limits
    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de generations IA atteinte", usage },
        { status: 403 }
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

    // Fetch full vault context (profile + resources), latest offer, agent-specific context, and RAG context
    const [vaultContext, { data: latestOffer }, agentContext, ragContext] = await Promise.all([
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
      ? `\n## Dernière offre\n- Nom : ${latestOffer.offer_name}\n- Positionnement : ${latestOffer.positioning || "Non défini"}\n- Mécanisme unique : ${latestOffer.unique_mechanism || "Non défini"}\n`
      : "";

    const fullSystemPrompt = `${agent.systemPrompt}\n\n${vaultContext}${offerBlock}${agentContext}${ragContext}`;

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
                `${m.role === "user" ? "Utilisateur" : "Assistant"}: ${m.content}`
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
      maxTokens: 2048,
    });

    return new Response(createStreamingResponse(stream), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error in chat:", error);
    return new Response(
      JSON.stringify({ error: "Erreur lors de la génération" }),
      { status: 500 }
    );
  }
}
