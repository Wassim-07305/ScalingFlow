import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { createClient } from "@/lib/supabase/server";
import { createStreamingResponse, streamText } from "@/lib/ai/generate";
import { getAgent, type AgentType } from "@/lib/ai/agents/index";
import { buildFullVaultContext } from "@/lib/ai/vault-context";

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

    // Fetch full vault context (profile + resources) and latest offer
    const [vaultContext, { data: latestOffer }] = await Promise.all([
      buildFullVaultContext(user.id),
      supabase
        .from("offers")
        .select("offer_name, positioning, unique_mechanism")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

    const offerBlock = latestOffer
      ? `\n## Dernière offre\n- Nom : ${latestOffer.offer_name}\n- Positionnement : ${latestOffer.positioning || "Non défini"}\n- Mécanisme unique : ${latestOffer.unique_mechanism || "Non défini"}\n`
      : "";

    const fullSystemPrompt = `${agent.systemPrompt}\n\n${vaultContext}${offerBlock}`;

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
