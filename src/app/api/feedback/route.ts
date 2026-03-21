import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const admin = createAdminClient();

    // Upload screenshot if provided
    let screenshotUrl: string | null = null;
    if (screenshot && screenshot.size > 0) {
      const buffer = Buffer.from(await screenshot.arrayBuffer());
      const ext = screenshot.type.split("/")[1] || "png";
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await admin.storage
        .from("feedback-screenshots")
        .upload(filePath, buffer, { contentType: screenshot.type, upsert: true });

      if (!uploadError) {
        const { data: urlData } = admin.storage
          .from("feedback-screenshots")
          .getPublicUrl(filePath);
        screenshotUrl = urlData.publicUrl;
      }
    }

    // Insert into bug_reports table
    const { error } = await admin.from("bug_reports").insert({
      user_id: user.id,
      subject: subject.trim(),
      description: description.trim(),
      page: page || null,
      screenshot_url: screenshotUrl,
      status: "new",
    });

    if (error) {
      console.error("[feedback] Insert error:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[feedback] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du rapport" },
      { status: 500 },
    );
  }
}
