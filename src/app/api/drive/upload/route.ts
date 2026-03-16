import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
];

// Infer MIME type from extension when browser doesn't provide one
function inferMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    txt: "text/plain",
    csv: "text/csv",
    md: "text/markdown",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
  };
  return ext && map[ext] ? map[ext] : "application/octet-stream";
}

// Ensure the drive bucket exists (uses service role)
async function ensureBucket() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = buckets?.some((b) => b.id === "drive");
  if (!exists) {
    await admin.storage.createBucket("drive", {
      public: false,
      fileSizeLimit: MAX_FILE_SIZE,
    });
  }
}

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
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Le fichier dépasse la limite de 50 Mo" },
        { status: 400 },
      );
    }

    // Resolve MIME type — use browser-provided type or infer from extension
    const mimeType = file.type || inferMimeType(file.name);

    // SECURITY: Validate file type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: `Type de fichier non autorisé (${mimeType})` },
        { status: 400 },
      );
    }

    // SECURITY: Sanitize filename to prevent path traversal
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = safeName.split(".").pop() || "bin";
    const storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

    // Ensure bucket exists before upload
    await ensureBucket();

    // Upload with service role to bypass storage RLS issues
    const admin = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
        )
      : null;

    const storageClient = admin || supabase;

    const { error: uploadError } = await storageClient.storage
      .from("drive")
      .upload(storagePath, file, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Erreur Storage: ${uploadError.message}` },
        { status: 500 },
      );
    }

    // Get signed URL (bucket is private)
    const { data: signedUrlData, error: signedUrlError } =
      await storageClient.storage
        .from("drive")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 year

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Signed URL error:", signedUrlError);
      return NextResponse.json(
        { error: "Erreur lors de la génération de l'URL du fichier" },
        { status: 500 },
      );
    }

    // Save metadata to drive_files (use user's client for RLS)
    const { data: driveFile, error: dbError } = await supabase
      .from("drive_files")
      .insert({
        user_id: user.id,
        folder_id: folderId || null,
        name: file.name,
        file_url: signedUrlData.signedUrl,
        file_size: file.size,
        mime_type: mimeType,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError);
      return NextResponse.json(
        { error: `Erreur de sauvegarde: ${dbError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json(driveFile);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 },
    );
  }
}
