import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/notifications/push";

type NotificationType = "milestone" | "badge" | "community" | "task" | "system" | "win";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: CreateNotificationParams) {
  const supabase = await createClient();

  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    link: link ?? null,
  });

  // Fire-and-forget push notification
  sendPushToUser(userId, { title, body: message, link, type }).catch(() => {});
}

// ─── Pre-built notification helpers ──────────────────────────

const GENERATION_LABELS: Record<string, { label: string; link: string }> = {
  "generation.market_analysis": { label: "Analyse de marché", link: "/market" },
  "generation.persona": { label: "Persona", link: "/market" },
  "generation.competitors": { label: "Analyse concurrents", link: "/market" },
  "generation.offer": { label: "Offre", link: "/offer" },
  "generation.category_os": { label: "Positionnement", link: "/offer" },
  "generation.score": { label: "Score offre", link: "/offer" },
  "generation.brand": { label: "Identité de marque", link: "/brand" },
  "generation.funnel": { label: "Funnel", link: "/funnel" },
  "generation.ads": { label: "Publicités", link: "/ads" },
  "generation.dm_script": { label: "Script DM", link: "/ads" },
  "generation.video_ad": { label: "Script vidéo ad", link: "/ads" },
  "generation.vsl": { label: "VSL", link: "/assets" },
  "generation.email": { label: "Séquence email", link: "/assets" },
  "generation.sms": { label: "Séquence SMS", link: "/assets" },
  "generation.sales_letter": { label: "Lettre de vente", link: "/assets" },
  "generation.pitch_deck": { label: "Pitch deck", link: "/assets" },
  "generation.setting_script": { label: "Script setting", link: "/assets" },
  "generation.lead_magnet": { label: "Lead magnet", link: "/assets" },
  "generation.content_strategy": { label: "Stratégie contenu", link: "/content" },
  "generation.reels": { label: "Scripts Reels", link: "/content" },
  "generation.youtube": { label: "Script YouTube", link: "/content" },
  "generation.stories": { label: "Scripts Stories", link: "/content" },
  "generation.carousel": { label: "Carrousel", link: "/content" },
  "generation.instagram": { label: "Profil Instagram", link: "/content" },
  "generation.editorial_calendar": { label: "Calendrier éditorial", link: "/content" },
  "generation.post": { label: "Post", link: "/content" },
  "generation.roadmap": { label: "Roadmap", link: "/roadmap" },
  "generation.vault_analysis": { label: "Analyse vault", link: "/vault" },
  "generation.chat": { label: "Chat IA", link: "/assistant" },
};

export async function notifyGeneration(userId: string, activityType: string) {
  const meta = GENERATION_LABELS[activityType];
  if (!meta) return;

  await createNotification({
    userId,
    type: "system",
    title: `${meta.label} générée`,
    message: `Ta ${meta.label.toLowerCase()} est prête. Consulte le résultat.`,
    link: meta.link,
  });
}
