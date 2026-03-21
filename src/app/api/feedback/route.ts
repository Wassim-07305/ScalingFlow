import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FEEDBACK_EMAIL = "lucas.adamymartin@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const subject = formData.get("subject") as string;
    const description = formData.get("description") as string;
    const page = formData.get("page") as string;
    const screenshot = formData.get("screenshot") as File | null;

    if (!subject?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: "L'objet et la description sont requis" },
        { status: 400 },
      );
    }

    // Get user profile for context
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, subscription_plan")
      .eq("id", user.id)
      .maybeSingle();

    const userName = profile?.full_name || user.email || "Utilisateur";
    const userEmail = profile?.email || user.email || "";

    // Build email HTML
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0E11; color: #E5E7EB; padding: 32px; border-radius: 16px;">
        <h2 style="color: #34D399; margin-top: 0;">Bug Report — ScalingFlow</h2>

        <div style="background: #141719; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <p style="margin: 0 0 8px; color: #9CA3AF; font-size: 12px;">Signalé par</p>
          <p style="margin: 0; font-weight: 600;">${userName} (${userEmail})</p>
        </div>

        <div style="background: #141719; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <p style="margin: 0 0 8px; color: #9CA3AF; font-size: 12px;">Objet</p>
          <p style="margin: 0; font-weight: 600;">${subject}</p>
        </div>

        <div style="background: #141719; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <p style="margin: 0 0 8px; color: #9CA3AF; font-size: 12px;">Description</p>
          <p style="margin: 0; white-space: pre-wrap;">${description}</p>
        </div>

        ${page ? `
        <div style="background: #141719; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <p style="margin: 0 0 8px; color: #9CA3AF; font-size: 12px;">Page</p>
          <p style="margin: 0; font-family: monospace; font-size: 13px;">${page}</p>
        </div>` : ""}

        <div style="background: #141719; border-radius: 12px; padding: 20px;">
          <p style="margin: 0 0 8px; color: #9CA3AF; font-size: 12px;">Détails techniques</p>
          <p style="margin: 0; font-family: monospace; font-size: 11px; color: #6B7280;">
            User ID: ${user.id}<br>
            Plan: ${profile?.subscription_plan || "free"}<br>
            Date: ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}
          </p>
        </div>
      </div>
    `;

    // Prepare attachments
    const attachments: { filename: string; content: Buffer }[] = [];
    if (screenshot && screenshot.size > 0) {
      const buffer = Buffer.from(await screenshot.arrayBuffer());
      attachments.push({
        filename: `screenshot-${Date.now()}.${screenshot.type.split("/")[1] || "png"}`,
        content: buffer,
      });
    }

    await resend.emails.send({
      from: "ScalingFlow <bugs@scalingflow.com>",
      to: FEEDBACK_EMAIL,
      replyTo: userEmail,
      subject: `[Bug] ${subject}`,
      html,
      ...(attachments.length > 0 ? { attachments } : {}),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[feedback] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du rapport" },
      { status: 500 },
    );
  }
}
