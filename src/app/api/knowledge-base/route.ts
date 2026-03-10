import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chunkDocument, storeChunks } from "@/lib/ai/rag";

/**
 * POST /api/knowledge-base
 * Index a document into the knowledge base (chunking + embedding + storage).
 *
 * Body: { documentId: string, content: string, title?: string, sourceType?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const body = await req.json();
    const { documentId, content, title, sourceType } = body as {
      documentId: string;
      content: string;
      title?: string;
      sourceType?: string;
    };

    if (!documentId || !content) {
      return NextResponse.json(
        { error: "documentId et content sont requis" },
        { status: 400 }
      );
    }

    // Delete existing chunks for this document (re-indexation)
    await supabase
      .from("document_chunks")
      .delete()
      .eq("user_id", user.id)
      .eq("document_id", documentId);

    // Chunk the document
    const chunks = chunkDocument(content);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Le document est vide ou invalide" },
        { status: 400 }
      );
    }

    // Store chunks with embeddings
    await storeChunks(user.id, documentId, chunks, {
      title: title || "Sans titre",
      source_type: sourceType || "document",
    });

    return NextResponse.json({
      success: true,
      chunks_count: chunks.length,
      document_id: documentId,
    });
  } catch (error) {
    console.error("Error indexing document:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'indexation du document" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge-base
 * Remove all chunks for a given document.
 *
 * Body: { documentId: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const body = await req.json();
    const { documentId } = body as { documentId: string };

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId est requis" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("document_chunks")
      .delete()
      .eq("user_id", user.id)
      .eq("document_id", documentId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, document_id: documentId });
  } catch (error) {
    console.error("Error deleting document chunks:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
