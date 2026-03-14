import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend/client";
import {
  welcomeEmail,
  generationCompleteEmail,
  milestoneEmail,
  streakReminderEmail,
} from "@/lib/resend/templates";

const FROM = "ScalingFlow <noreply@scalingflow.com>";

/** Résout le template a partir de son nom + data arbitraire. */
function resolveTemplate(
  template: string,
  data: Record<string, unknown>
): { subject: string; html: string } | null {
  const firstName = (data.firstName as string) ?? "Utilisateur";

  switch (template) {
    case "welcome":
      return welcomeEmail(firstName);

    case "generation-complete":
      return generationCompleteEmail(
        firstName,
        (data.generationType as string) ?? "Contenu"
      );

    case "milestone":
      return milestoneEmail(
        firstName,
        (data.milestone as string) ?? "Nouveau niveau",
        (data.xp as number) ?? 0
      );

    case "streak-reminder":
      return streakReminderEmail(
        firstName,
        (data.streakDays as number) ?? 1
      );

    default:
      return null;
  }
}

export async function POST(request: Request) {
  // Vérifier que Resend est configure
  if (!resend) {
    return NextResponse.json(
      { error: "Service email non configuré" },
      { status: 503 }
    );
  }

  // Authentification via Supabase
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  // Parser le body
  const body = (await request.json()) as {
    template?: string;
    data?: Record<string, unknown>;
  };

  if (!body.template) {
    return NextResponse.json(
      { error: "Le champ 'template' est requis" },
      { status: 400 }
    );
  }

  // Résoudre le template
  const emailContent = resolveTemplate(body.template, body.data ?? {});

  if (!emailContent) {
    return NextResponse.json(
      { error: `Template inconnu : ${body.template}` },
      { status: 400 }
    );
  }

  // Envoyer l'email
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: user.email!,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  if (error) {
    return NextResponse.json(
      { error: "Échec de l'envoi de l'email" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, id: data?.id });
}
