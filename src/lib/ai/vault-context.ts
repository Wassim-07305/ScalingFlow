import { createClient } from "@/lib/supabase/server";

/**
 * Fetches the user's vault resources with extracted text and builds
 * a context string that can be injected into any AI prompt.
 *
 * This enables RAG-lite: all AI agents can reference the user's
 * uploaded documents, testimonials, transcripts, etc.
 *
 * @param userId - The user's ID
 * @param maxChars - Maximum total characters to include (default 8000)
 * @returns A formatted context string, or empty string if no resources
 */
export async function buildVaultResourcesContext(
  userId: string,
  maxChars = 8000
): Promise<string> {
  const supabase = await createClient();

  const { data: resources } = await supabase
    .from("vault_resources")
    .select("title, resource_type, url, extracted_text")
    .eq("user_id", userId)
    .not("extracted_text", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!resources || resources.length === 0) return "";

  let context = "\n## RESSOURCES VAULT DE L'UTILISATEUR\n";
  context +=
    "L'utilisateur a uploadé les ressources suivantes. Utilise-les pour personnaliser tes réponses et rendre le contenu généré unique et spécifique à son expertise.\n\n";

  let totalChars = context.length;

  for (const resource of resources) {
    if (!resource.extracted_text) continue;

    const header = `### ${resource.title} (${resource.resource_type}${resource.url ? `, ${resource.url}` : ""})\n`;
    const text = resource.extracted_text;

    // Check if we have room
    const needed = header.length + Math.min(text.length, 2000) + 10;
    if (totalChars + needed > maxChars) {
      // Add a note about truncated resources
      context += "\n[... autres ressources tronquées pour raison de taille]\n";
      break;
    }

    // Truncate individual resource text to 2000 chars
    const truncatedText =
      text.length > 2000 ? text.slice(0, 2000) + "\n[... tronqué]" : text;

    context += header + truncatedText + "\n\n";
    totalChars += header.length + truncatedText.length + 2;
  }

  return context;
}

/**
 * Fetches the full vault profile context for AI prompts.
 * Combines profile data + vault resources.
 */
export async function buildFullVaultContext(userId: string): Promise<string> {
  const supabase = await createClient();

  const [{ data: profile }, resourcesContext] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "first_name, situation, situation_details, vault_skills, expertise_answers, parcours, experience_level, current_revenue, target_revenue, industries, objectives, selected_market, niche"
      )
      .eq("id", userId)
      .single(),
    buildVaultResourcesContext(userId),
  ]);

  if (!profile) return resourcesContext;

  let context = "## PROFIL VAULT DE L'UTILISATEUR\n";
  if (profile.first_name) context += `- Prénom : ${profile.first_name}\n`;
  if (profile.situation) context += `- Situation : ${profile.situation}\n`;
  if (profile.parcours) context += `- Parcours : ${profile.parcours}\n`;
  if (profile.experience_level) context += `- Niveau : ${profile.experience_level}\n`;
  if (profile.current_revenue) context += `- Revenu actuel : ${profile.current_revenue} EUR/mois\n`;
  if (profile.target_revenue) context += `- Objectif : ${profile.target_revenue} EUR/mois\n`;
  if (profile.selected_market) context += `- Marché sélectionné : ${profile.selected_market}\n`;
  if (profile.niche) context += `- Niche : ${profile.niche}\n`;

  const skills = profile.vault_skills as { name: string; level: string }[] | null;
  if (skills && Array.isArray(skills) && skills.length > 0) {
    context += "\n### Compétences\n";
    for (const s of skills) {
      context += `- ${s.name} (${s.level})\n`;
    }
  }

  const expertise = profile.expertise_answers as Record<string, string> | null;
  if (expertise && Object.keys(expertise).length > 0) {
    context += "\n### Expertise\n";
    for (const [k, v] of Object.entries(expertise)) {
      if (v) context += `- ${k}: ${v}\n`;
    }
  }

  const industries = profile.industries as string[] | null;
  if (industries && industries.length > 0) {
    context += `\n### Industries : ${industries.join(", ")}\n`;
  }

  const objectives = profile.objectives as string[] | null;
  if (objectives && objectives.length > 0) {
    context += `### Objectifs : ${objectives.join(", ")}\n`;
  }

  return context + resourcesContext;
}
