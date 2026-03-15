"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav, type BreadcrumbFolder } from "@/components/drive/breadcrumb-nav";
import { FolderCard } from "@/components/drive/folder-card";
import { FileCard } from "@/components/drive/file-card";
import { FilePreviewModal } from "@/components/drive/file-preview-modal";
import { CreateFolderModal } from "@/components/drive/create-folder-modal";
import { UploadFileModal } from "@/components/drive/upload-file-modal";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  FolderPlus,
  Upload,
  FolderOpen,
  Loader2,
} from "lucide-react";

interface DriveFolder {
  id: string;
  name: string;
  parent_id: string | null;
  color: string;
  created_at: string;
  fileCount?: number;
}

interface DriveFile {
  id: string;
  name: string;
  folder_id: string | null;
  file_url: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export default function DrivePage() {
  const [currentFolderId, setCurrentFolderId] = React.useState<string | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = React.useState<BreadcrumbFolder[]>([]);
  const [folders, setFolders] = React.useState<DriveFolder[]>([]);
  const [files, setFiles] = React.useState<DriveFile[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [createFolderOpen, setCreateFolderOpen] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [renameFolderId, setRenameFolderId] = React.useState<string | null>(null);
  const [previewFile, setPreviewFile] = React.useState<{
    name: string;
    fileUrl: string;
    mimeType: string;
  } | null>(null);

  const supabase = React.useMemo(() => createClient(), []);

  // Load contents of current folder
  const loadContents = React.useCallback(async () => {
    setLoading(true);
    try {
      // Fetch subfolders
      const folderQuery = supabase
        .from("drive_folders")
        .select("*")
        .order("name");

      if (currentFolderId) {
        folderQuery.eq("parent_id", currentFolderId);
      } else {
        folderQuery.is("parent_id", null);
      }

      const { data: folderData } = await folderQuery;

      // Get file counts for each folder (parallel)
      const rawFolders = (folderData || []) as DriveFolder[];
      const countPromises = rawFolders.map((f) =>
        supabase
          .from("drive_files")
          .select("id", { count: "exact", head: true })
          .eq("folder_id", f.id)
          .then(({ count }: { count: number | null }) => ({ ...f, fileCount: count || 0 }))
      );
      const foldersWithCounts = await Promise.all(countPromises);
      setFolders(foldersWithCounts);

      // Fetch files in current folder
      const fileQuery = supabase
        .from("drive_files")
        .select("*")
        .order("created_at", { ascending: false });

      if (currentFolderId) {
        fileQuery.eq("folder_id", currentFolderId);
      } else {
        fileQuery.is("folder_id", null);
      }

      const { data: fileData } = await fileQuery;
      setFiles((fileData || []) as DriveFile[]);
    } catch {
      toast.error("Erreur lors du chargement des fichiers");
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, supabase]);

  React.useEffect(() => {
    loadContents();
  }, [loadContents]);

  // Navigate to a folder
  const navigateToFolder = async (folderId: string | null) => {
    setCurrentFolderId(folderId);

    if (!folderId) {
      setBreadcrumbPath([]);
      return;
    }

    // Build breadcrumb path by traversing parent_ids
    const path: BreadcrumbFolder[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const { data: folderData } = await supabase
        .from("drive_folders")
        .select("id, name, parent_id")
        .eq("id", currentId)
        .single();

      const folder = folderData as { id: string; name: string; parent_id: string | null } | null;
      if (!folder) break;
      path.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parent_id;
    }

    setBreadcrumbPath(path);
  };

  // Create folder
  const handleCreateFolder = async (name: string, color: string) => {
    const { error } = await supabase.from("drive_folders").insert({
      name,
      color,
      parent_id: currentFolderId,
    });

    if (error) {
      toast.error("Erreur lors de la création du dossier");
      throw error;
    }

    toast.success(`Dossier "${name}" créé`);
    loadContents();
  };

  // Rename folder
  const handleRenameFolder = async (name: string, color: string) => {
    if (!renameFolderId) return;
    const { error } = await supabase
      .from("drive_folders")
      .update({ name, color, updated_at: new Date().toISOString() })
      .eq("id", renameFolderId);

    if (error) {
      toast.error("Erreur lors du renommage");
      throw error;
    }

    toast.success("Dossier renommé");
    setRenameFolderId(null);
    loadContents();
  };

  // Delete folder
  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Supprimer ce dossier et tous ses fichiers ?")) return;

    const { error } = await supabase
      .from("drive_folders")
      .delete()
      .eq("id", folderId);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success("Dossier supprimé");
    loadContents();
  };

  // Rename file
  const handleRenameFile = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    const newName = prompt("Nouveau nom du fichier :", file.name);
    if (!newName || newName.trim() === file.name) return;

    const { error } = await supabase
      .from("drive_files")
      .update({ name: newName.trim() })
      .eq("id", fileId);

    if (error) {
      toast.error("Erreur lors du renommage");
      return;
    }

    toast.success("Fichier renommé");
    loadContents();
  };

  // Delete file
  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Supprimer ce fichier ?")) return;

    // Get file URL to extract storage path before deleting the record
    const file = files.find((f) => f.id === fileId);

    const { error } = await supabase
      .from("drive_files")
      .delete()
      .eq("id", fileId);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    // Best-effort cleanup from Supabase Storage
    if (file?.file_url) {
      try {
        const url = new URL(file.file_url);
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/drive\/(.+)$/);
        if (pathMatch?.[1]) {
          await supabase.storage.from("drive").remove([decodeURIComponent(pathMatch[1])]);
        }
      } catch {
        // Storage cleanup failure is non-critical
      }
    }

    toast.success("Fichier supprimé");
    loadContents();
  };

  const renameFolder = folders.find((f) => f.id === renameFolderId);
  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div>
      <PageHeader
        title="Drive"
        description="Ton espace de stockage interne pour organiser tous tes fichiers."
      >
        <Button variant="outline" onClick={() => setCreateFolderOpen(true)}>
          <FolderPlus className="h-4 w-4 mr-2" />
          Nouveau dossier
        </Button>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Uploader un fichier
        </Button>
      </PageHeader>

      {/* Breadcrumb */}
      <div className="mb-6">
        <BreadcrumbNav path={breadcrumbPath} onNavigate={navigateToFolder} />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 text-accent animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 mb-4">
            <FolderOpen className="h-8 w-8 text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            {currentFolderId ? "Ce dossier est vide" : "Ton Drive est vide"}
          </h3>
          <p className="text-sm text-text-secondary max-w-sm mb-6">
            {currentFolderId
              ? "Ajoute des fichiers ou crée des sous-dossiers pour organiser tes documents."
              : "Commence par créer un dossier ou uploader tes premiers fichiers."}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setCreateFolderOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Nouveau dossier
            </Button>
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Uploader
            </Button>
          </div>
        </div>
      )}

      {/* Grid content */}
      {!loading && !isEmpty && (
        <div className="space-y-6">
          {/* Folders */}
          {folders.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Dossiers ({folders.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {folders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    id={folder.id}
                    name={folder.name}
                    color={folder.color}
                    fileCount={folder.fileCount || 0}
                    onClick={() => navigateToFolder(folder.id)}
                    onRename={() => setRenameFolderId(folder.id)}
                    onDelete={() => handleDeleteFolder(folder.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {files.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Fichiers ({files.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {files.map((file) => (
                  <FileCard
                    key={file.id}
                    id={file.id}
                    name={file.name}
                    fileUrl={file.file_url}
                    fileSize={file.file_size}
                    mimeType={file.mime_type}
                    createdAt={file.created_at}
                    onRename={() => handleRenameFile(file.id)}
                    onDelete={() => handleDeleteFile(file.id)}
                    onPreview={() =>
                      setPreviewFile({
                        name: file.name,
                        fileUrl: file.file_url,
                        mimeType: file.mime_type,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateFolderModal
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onSubmit={handleCreateFolder}
        mode="create"
      />

      {renameFolderId && renameFolder && (
        <CreateFolderModal
          open={true}
          onOpenChange={(open) => {
            if (!open) setRenameFolderId(null);
          }}
          onSubmit={handleRenameFolder}
          initialName={renameFolder.name}
          initialColor={renameFolder.color}
          mode="rename"
        />
      )}

      <UploadFileModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        folderId={currentFolderId}
        onUploadComplete={loadContents}
      />

      <FilePreviewModal
        open={previewFile !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewFile(null);
        }}
        file={previewFile}
      />
    </div>
  );
}
