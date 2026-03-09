"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Trash2,
  File,
  Image as ImageIcon,
  Music,
  FolderOpen,
} from "lucide-react";

const CATEGORIES = [
  { value: "case_study", label: "Etude de cas" },
  { value: "sop", label: "SOP / Process" },
  { value: "transcript", label: "Transcript" },
  { value: "testimonial", label: "Temoignage" },
  { value: "other", label: "Autre" },
] as const;

interface VaultDocument {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  category: string;
  file_size: number;
  created_at: string;
}

export function VaultDocuments() {
  const { user } = useUser();
  const [documents, setDocuments] = React.useState<VaultDocument[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState("case_study");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!user) return;
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("vault_documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setDocuments((data as VaultDocument[]) || []);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploading(true);
    const supabase = createClient();

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("vault-documents")
        .upload(filePath, file);

      if (uploadError) {
        toast.error(`Erreur upload: ${file.name}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("vault-documents")
        .getPublicUrl(filePath);

      await supabase.from("vault_documents").insert({
        user_id: user.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: fileExt || "unknown",
        category: selectedCategory,
        file_size: file.size,
      });
    }

    toast.success("Document(s) uploade(s) !");
    await fetchDocuments();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (doc: VaultDocument) => {
    if (!user) return;
    const supabase = createClient();

    const filePath = `${user.id}/${doc.file_name}`;
    await supabase.storage.from("vault-documents").remove([filePath]);
    await supabase.from("vault_documents").delete().eq("id", doc.id);

    toast.success("Document supprime");
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
  };

  const getFileIcon = (type: string) => {
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(type)) return ImageIcon;
    if (["mp3", "wav", "m4a", "ogg"].includes(type)) return Music;
    return FileText;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) return <AILoading text="Chargement des documents" />;

  return (
    <div className="space-y-6">
      {/* Upload section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-accent" />
            Uploader un document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  selectedCategory === cat.value
                    ? "bg-accent text-white"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border-default rounded-xl p-8 text-center cursor-pointer hover:border-accent/50 transition-colors"
          >
            <Upload className="h-8 w-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary">
              {uploading ? "Upload en cours..." : "Clique ou glisse tes fichiers ici"}
            </p>
            <p className="text-xs text-text-muted mt-1">PDF, DOCX, images, audio</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png,.gif,.mp3,.wav,.m4a"
              onChange={handleUpload}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents list */}
      {documents.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Aucun document"
          description="Uploade tes case studies, SOPs, transcripts et temoignages pour enrichir ton vault."
        />
      ) : (
        <div className="grid gap-3">
          {documents.map((doc) => {
            const Icon = getFileIcon(doc.file_type);
            const category = CATEGORIES.find((c) => c.value === doc.category);
            return (
              <Card key={doc.id} className="hover:border-accent/20 transition-colors">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-bg-tertiary">
                        <Icon className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{doc.file_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="muted" className="text-xs">
                            {category?.label || doc.category}
                          </Badge>
                          <span className="text-xs text-text-muted">{formatSize(doc.file_size)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.file_url, "_blank")}
                      >
                        <File className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc)}
                        className="text-danger hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
