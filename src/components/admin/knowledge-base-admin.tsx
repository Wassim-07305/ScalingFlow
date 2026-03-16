"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  Trash2,
  Search,
  FileText,
  BookOpen,
  Plus,
  X,
  Database,
  Filter,
} from "lucide-react";

interface KnowledgeBaseEntry {
  document_id: string;
  title: string;
  source_type: string;
  chunk_count: number;
  total_chars: number;
  created_at: string;
}

const CATEGORIES = [
  { value: "framework", label: "Framework" },
  { value: "livre", label: "Livre" },
  { value: "formation", label: "Formation" },
  { value: "template", label: "Template" },
  { value: "document", label: "Document" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];

const CATEGORY_BADGE_VARIANT: Record<
  Category,
  "default" | "blue" | "cyan" | "purple" | "yellow" | "muted"
> = {
  framework: "blue",
  livre: "purple",
  formation: "cyan",
  template: "yellow",
  document: "muted",
};

export function KnowledgeBaseAdmin() {
  const { user } = useUser();
  const supabase = createClient();

  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Upload form state
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<Category>("document");
  const [formContent, setFormContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // ─── Fetch entries ──────────────────────────────────────────
  const fetchEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Récupérer les chunks groupés par document_id
      const { data, error } = await supabase
        .from("document_chunks")
        .select("document_id, metadata, content, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Grouper par document_id
      const grouped = new Map<
        string,
        {
          document_id: string;
          title: string;
          source_type: string;
          chunk_count: number;
          total_chars: number;
          created_at: string;
        }
      >();

      for (const chunk of data ?? []) {
        const docId = chunk.document_id;
        const meta = chunk.metadata as {
          title?: string;
          source_type?: string;
        } | null;

        if (!grouped.has(docId)) {
          grouped.set(docId, {
            document_id: docId,
            title: meta?.title || "Sans titre",
            source_type: meta?.source_type || "document",
            chunk_count: 0,
            total_chars: 0,
            created_at: chunk.created_at,
          });
        }

        const entry = grouped.get(docId)!;
        entry.chunk_count += 1;
        entry.total_chars += (chunk.content || "").length;
      }

      setEntries(Array.from(grouped.values()));
    } catch {
      toast.error("Impossible de charger la base de connaissances");
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // ─── Upload document ───────────────────────────────────────
  const handleUpload = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error("Le titre et le contenu sont requis");
      return;
    }

    setUploading(true);
    try {
      const documentId = `kb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const res = await fetch("/api/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          content: formContent,
          title: formTitle.trim(),
          sourceType: formCategory,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'indexation");
      }

      toast.success("Document indexé avec succès");
      setFormTitle("");
      setFormContent("");
      setFormCategory("document");
      setShowForm(false);
      fetchEntries();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  // ─── File upload handler ───────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type
    const validTypes = [
      "text/plain",
      "text/markdown",
      "text/csv",
      "application/json",
    ];
    const isText =
      validTypes.includes(file.type) ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".txt");

    if (!isText) {
      toast.error(
        "Seuls les fichiers texte (.txt, .md, .csv, .json) sont acceptés pour le moment",
      );
      return;
    }

    try {
      const text = await file.text();
      setFormContent(text);
      if (!formTitle.trim()) {
        setFormTitle(file.name.replace(/\.[^.]+$/, ""));
      }
      toast.success(`Fichier "${file.name}" chargé`);
    } catch {
      toast.error("Impossible de lire le fichier");
    }

    // Reset input
    e.target.value = "";
  };

  // ─── Delete document ───────────────────────────────────────
  const handleDelete = async (documentId: string) => {
    setDeleting(documentId);
    try {
      const res = await fetch("/api/knowledge-base", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      toast.success("Document supprimé");
      setEntries((prev) => prev.filter((e) => e.document_id !== documentId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(msg);
    } finally {
      setDeleting(null);
    }
  };

  // ─── Filter & search ──────────────────────────────────────
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      !searchQuery ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.document_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || entry.source_type === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalDocs = entries.length;
  const totalChars = entries.reduce((sum, e) => sum + e.total_chars, 0);
  const totalChunks = entries.reduce((sum, e) => sum + e.chunk_count, 0);

  const formatSize = (chars: number): string => {
    if (chars < 1000) return `${chars} car.`;
    if (chars < 1_000_000) return `${(chars / 1000).toFixed(1)}k car.`;
    return `${(chars / 1_000_000).toFixed(1)}M car.`;
  };

  return (
    <div className="space-y-6">
      {/* ─── Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            icon: FileText,
            label: "Documents",
            value: totalDocs.toString(),
            color: "text-info",
          },
          {
            icon: Database,
            label: "Chunks",
            value: totalChunks.toString(),
            color: "text-accent",
          },
          {
            icon: BookOpen,
            label: "Taille totale",
            value: formatSize(totalChars),
            color: "text-warning",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-[12px] border border-border-default bg-bg-secondary p-4 flex items-center gap-3"
          >
            <div
              className={cn(
                "h-10 w-10 rounded-[8px] bg-bg-tertiary flex items-center justify-center",
                stat.color,
              )}
            >
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-text-muted">{stat.label}</p>
              <p className="text-sm font-medium text-text-primary">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Toolbar ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-muted" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">Toutes catégories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="gap-2 ml-auto"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Annuler
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Ajouter un document
            </>
          )}
        </Button>
      </div>

      {/* ─── Upload form ───────────────────────────────────────── */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nouveau document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">
                  Titre
                </label>
                <Input
                  placeholder="Nom du document"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">
                  Catégorie
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as Category)}
                  className="w-full text-sm bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-text-muted mb-1.5 block">
                Contenu
              </label>
              <textarea
                placeholder="Colle le contenu du document ici..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={8}
                className="w-full text-sm bg-bg-secondary border border-border-default rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent resize-y"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".txt,.md,.csv,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors">
                  <Upload className="h-4 w-4" />
                  Importer un fichier
                </span>
              </label>
              <span className="text-xs text-text-muted">
                .txt, .md, .csv, .json
              </span>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={uploading || !formTitle.trim() || !formContent.trim()}
                className="gap-2"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? "Indexation..." : "Indexer le document"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Documents list ────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-10 w-10 text-text-muted/40 mb-3" />
          <p className="text-sm text-text-muted">
            {entries.length === 0
              ? "Aucun document dans la base de connaissances."
              : "Aucun document ne correspond à ta recherche."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEntries.map((entry) => (
            <div
              key={entry.document_id}
              className="flex items-center gap-4 p-4 rounded-xl bg-bg-tertiary border border-border-default hover:border-border-hover transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-bg-secondary flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-text-muted" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {entry.title}
                  </p>
                  <Badge
                    variant={
                      CATEGORY_BADGE_VARIANT[entry.source_type as Category] ||
                      "muted"
                    }
                  >
                    {CATEGORIES.find((c) => c.value === entry.source_type)
                      ?.label || entry.source_type}
                  </Badge>
                </div>
                <p className="text-xs text-text-muted">
                  {entry.chunk_count} chunks &middot;{" "}
                  {formatSize(entry.total_chars)}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(entry.document_id)}
                disabled={deleting === entry.document_id}
                className="text-text-muted hover:text-red-400 shrink-0"
              >
                {deleting === entry.document_id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
