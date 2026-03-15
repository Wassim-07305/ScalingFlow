import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

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
    const file = formData.get("file") as File | null;
    const folderId = formData.get("folder_id") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Le fichier dépasse la limite de 50 Mo" },
        { status: 400 }
      );
    }

    // SECURITY: Validate file type (not just extension)
    const ALLOWED_MIME_TYPES = [
      "application/pdf",
      "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
      "text/plain", "text/csv", "text/markdown",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "video/mp4", "video/quicktime", "video/webm",
      "audio/mpeg", "audio/wav", "audio/ogg",
    ];

    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé" },
        { status: 400 }
      );
    }

    // SECURITY: Sanitize filename to prevent path traversal
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    // Upload to Supabase Storage
    const ext = safeName.split(".").pop() || "bin";
    const storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("drive")
      .upload(storagePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Erreur lors de l'upload du fichier" },
        { status: 500 }
      );
    }

    // Get signed URL (bucket is private — getPublicUrl won't work)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("drive")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 year

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Signed URL error:", signedUrlError);
      return NextResponse.json(
        { error: "Erreur lors de la génération de l'URL du fichier" },
        { status: 500 }
      );
    }

    const publicUrl = signedUrlData.signedUrl;

    // Save metadata to drive_files
    const { data: driveFile, error: dbError } = await supabase
      .from("drive_files")
      .insert({
        user_id: user.id,
        folder_id: folderId || null,
        name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type || "application/octet-stream",
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError);
      return NextResponse.json(
        { error: "Erreur de sauvegarde" },
        { status: 500 }
      );
    }

    return NextResponse.json(driveFile);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}
