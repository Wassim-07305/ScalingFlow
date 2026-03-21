import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const AD_IMAGES_BUCKET = "ad-images";
const MAX_AGE_DAYS = 30;

/**
 * CRON: Clean up ad images older than 30 days from Supabase Storage.
 * Schedule: weekly (e.g., every Sunday at 3am)
 * Vercel CRON: POST /api/cron/cleanup-ad-images
 */
export async function POST(req: NextRequest) {
  try {
    // Verify CRON secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const cutoffDate = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

    // List all folders (user IDs) in the bucket
    const { data: folders, error: listError } = await supabase.storage
      .from(AD_IMAGES_BUCKET)
      .list("", { limit: 1000 });

    if (listError) {
      console.error("[cleanup-ad-images] Error listing folders:", listError);
      return NextResponse.json({ error: "Erreur listing" }, { status: 500 });
    }

    let totalDeleted = 0;
    let totalErrors = 0;

    for (const folder of folders || []) {
      if (!folder.name) continue;

      // List files in each user folder
      const { data: files } = await supabase.storage
        .from(AD_IMAGES_BUCKET)
        .list(folder.name, { limit: 500 });

      if (!files?.length) continue;

      // Filter files older than cutoff
      const oldFiles = files.filter((file) => {
        if (!file.created_at) return false;
        return new Date(file.created_at) < cutoffDate;
      });

      if (oldFiles.length === 0) continue;

      // Delete old files
      const filePaths = oldFiles.map((f) => `${folder.name}/${f.name}`);
      const { error: deleteError } = await supabase.storage
        .from(AD_IMAGES_BUCKET)
        .remove(filePaths);

      if (deleteError) {
        console.error(`[cleanup-ad-images] Error deleting files for ${folder.name}:`, deleteError);
        totalErrors += filePaths.length;
      } else {
        totalDeleted += filePaths.length;
      }
    }

    console.log(`[cleanup-ad-images] Deleted ${totalDeleted} images, ${totalErrors} errors`);

    return NextResponse.json({
      success: true,
      deleted: totalDeleted,
      errors: totalErrors,
      cutoff: cutoffDate.toISOString(),
    });
  } catch (error) {
    console.error("[cleanup-ad-images] Error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
