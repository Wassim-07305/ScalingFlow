import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/vault/upload
 * Upload a file to the vault, store in Supabase Storage, extract text, save to vault_resources.
 *
 * Accepts: multipart/form-data with fields:
 *   - file: File (PDF, txt, md, csv, doc, docx, images)
 *   - title: string (optional, defaults to filename)
 *   - resource_type: string (optional, defaults to "doc")
 */
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
    const title = (formData.get("title") as string) || "";
    const resourceType = (formData.get("resource_type") as string) || "doc";

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 10 MB)" },
        { status: 400 }
      );
    }

    // SECURITY: Validate file type
    const ALLOWED_VAULT_TYPES = [
      "application/pdf",
      "text/plain", "text/csv", "text/markdown",
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (file.type && !ALLOWED_VAULT_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé pour le vault" },
        { status: 400 }
      );
    }

    // SECURITY: Sanitize filename to prevent path traversal
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    // Upload to Supabase Storage
    const ext = safeName.split(".").pop() || "bin";
    const storagePath = `${user.id}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("vault-resources")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Erreur lors de l'upload" },
        { status: 500 }
      );
    }

    // Extract text from the file
    let extractedText: string | null = null;

    if (file.type === "application/pdf") {
      extractedText = await extractPdfText(file);
    } else if (
      file.type === "text/plain" ||
      file.type === "text/markdown" ||
      file.type === "text/csv"
    ) {
      extractedText = await file.text();
    }

    // Truncate extracted text to avoid huge DB entries (max ~50K chars)
    if (extractedText && extractedText.length > 50000) {
      extractedText = extractedText.slice(0, 50000);
    }

    // Save to vault_resources
    const { data: resource, error: dbError } = await supabase
      .from("vault_resources")
      .insert({
        user_id: user.id,
        resource_type: resourceType as "doc" | "youtube" | "instagram" | "transcript" | "testimonial" | "other",
        file_path: storagePath,
        title: title || file.name,
        extracted_text: extractedText,
        file_size: file.size,
        content_type: file.type,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      resource,
      has_extracted_text: !!extractedText,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur interne lors de l'upload" },
      { status: 500 }
    );
  }
}

/**
 * Extract text from a PDF file using pdf-parse.
 */
async function extractPdfText(file: File): Promise<string | null> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const result = await pdfParse(buffer);
    return result.text || null;
  } catch {
    return null;
  }
}
