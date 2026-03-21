"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Video,
  BookOpen,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  ArrowLeft,
  Clock,
  Eye,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface AcademyModule {
  id: string;
  module_name: string;
  module_slug: string;
  module_description: string | null;
  module_order: number;
  icon: string | null;
  color: string | null;
  total_videos: number;
  total_duration_minutes: number;
  created_at: string;
}

interface AcademyVideo {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  video_order: number;
  resources: Record<string, unknown> | null;
  related_saas_module: string | null;
  created_at: string;
}

// ─── Module Form ────────────────────────────────────────────────

function ModuleForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: AcademyModule | null;
  onSave: (data: Partial<AcademyModule>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.module_name || "");
  const [description, setDescription] = useState(
    initial?.module_description || "",
  );
  const [icon, setIcon] = useState(initial?.icon || "BookOpen");
  const [color, setColor] = useState(initial?.color || "#34D399");
  const [order, setOrder] = useState(initial?.module_order ?? 1);

  return (
    <Card className="border-accent/30 bg-bg-secondary/50">
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nom du module *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Créer ton offre irrésistible"
              className="bg-bg-tertiary"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Icône</Label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="BookOpen"
                className="bg-bg-tertiary"
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-9 rounded cursor-pointer border-0"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="bg-bg-tertiary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ordre</Label>
              <Input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="bg-bg-tertiary"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décris le contenu de ce module..."
            className="w-full rounded-xl border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent min-h-[80px] resize-y"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            <X className="h-4 w-4 mr-1" /> Annuler
          </Button>
          <Button
            onClick={() =>
              onSave({
                module_name: name,
                module_description: description || null,
                module_slug:
                  initial?.module_slug ||
                  name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/-+$/, ""),
                icon,
                color,
                module_order: order,
              })
            }
            disabled={!name.trim() || saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {initial ? "Modifier" : "Créer le module"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Video Form ─────────────────────────────────────────────────

function VideoForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: AcademyVideo | null;
  onSave: (data: Partial<AcademyVideo>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [videoUrl, setVideoUrl] = useState(initial?.video_url || "");
  const [duration, setDuration] = useState(initial?.duration_minutes ?? 10);
  const [order, setOrder] = useState(initial?.video_order ?? 1);
  const [relatedModule, setRelatedModule] = useState(
    initial?.related_saas_module || "",
  );

  return (
    <div className="rounded-xl border border-accent/20 bg-bg-secondary/50 p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Titre *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Les fondamentaux d'une offre"
            className="bg-bg-tertiary"
          />
        </div>
        <div className="space-y-2">
          <Label>URL vidéo (Loom, YouTube, Vimeo)</Label>
          <Input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.loom.com/share/xxx"
            className="bg-bg-tertiary"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Synopsis de la vidéo..."
          className="w-full rounded-xl border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent min-h-[60px] resize-y"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Durée (min)</Label>
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="bg-bg-tertiary"
          />
        </div>
        <div className="space-y-2">
          <Label>Ordre</Label>
          <Input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="bg-bg-tertiary"
          />
        </div>
        <div className="space-y-2">
          <Label>Module SaaS lié</Label>
          <Input
            value={relatedModule}
            onChange={(e) => setRelatedModule(e.target.value)}
            placeholder="offer, market, funnel..."
            className="bg-bg-tertiary"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          <X className="h-4 w-4 mr-1" /> Annuler
        </Button>
        <Button
          onClick={() =>
            onSave({
              title,
              description: description || null,
              video_url: videoUrl || null,
              duration_minutes: duration,
              video_order: order,
              related_saas_module: relatedModule || null,
            })
          }
          disabled={!title.trim() || saving}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          {initial ? "Modifier" : "Ajouter la vidéo"}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function AdminAcademyPage() {
  const { profile, loading: userLoading } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const [modules, setModules] = useState<AcademyModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Module form
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<AcademyModule | null>(
    null,
  );

  // Expanded module (to see/manage videos)
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [moduleVideos, setModuleVideos] = useState<
    Record<string, AcademyVideo[]>
  >({});
  const [loadingVideos, setLoadingVideos] = useState<string | null>(null);

  // Video form
  const [showVideoForm, setShowVideoForm] = useState<string | null>(null); // module_id
  const [editingVideo, setEditingVideo] = useState<AcademyVideo | null>(null);

  // ── Fetch modules ──
  const fetchModules = useCallback(async () => {
    const { data, error } = await supabase
      .from("academy_modules")
      .select("*")
      .order("module_order", { ascending: true });

    if (!error && data) setModules(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // ── Fetch videos for a module ──
  const fetchVideos = useCallback(
    async (moduleId: string) => {
      setLoadingVideos(moduleId);
      const { data, error } = await supabase
        .from("academy_videos")
        .select("*")
        .eq("module_id", moduleId)
        .order("video_order", { ascending: true });

      if (!error && data) {
        setModuleVideos((prev) => ({ ...prev, [moduleId]: data }));
      }
      setLoadingVideos(null);
    },
    [supabase],
  );

  // ── Toggle expand module ──
  const toggleModule = (moduleId: string) => {
    if (expandedModuleId === moduleId) {
      setExpandedModuleId(null);
    } else {
      setExpandedModuleId(moduleId);
      if (!moduleVideos[moduleId]) {
        fetchVideos(moduleId);
      }
    }
  };

  // ── Module CRUD ──
  const saveModule = async (data: Partial<AcademyModule>) => {
    setSaving(true);
    try {
      if (editingModule) {
        const { error } = await supabase
          .from("academy_modules")
          .update(data)
          .eq("id", editingModule.id);
        if (error) throw error;
        toast.success("Module modifié");
      } else {
        const { error } = await supabase
          .from("academy_modules")
          .insert({ ...data, total_videos: 0, total_duration_minutes: 0 });
        if (error) throw error;
        toast.success("Module créé");
      }
      setShowModuleForm(false);
      setEditingModule(null);
      fetchModules();
    } catch (err) {
      toast.error(
        `Erreur : ${err instanceof Error ? err.message : "Échec de la sauvegarde"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (!confirm("Supprimer ce module et toutes ses vidéos ?")) return;
    const { error } = await supabase
      .from("academy_modules")
      .delete()
      .eq("id", moduleId);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Module supprimé");
      fetchModules();
      if (expandedModuleId === moduleId) setExpandedModuleId(null);
    }
  };

  // ── Video CRUD ──
  const saveVideo = async (moduleId: string, data: Partial<AcademyVideo>) => {
    setSaving(true);
    try {
      if (editingVideo) {
        const { error } = await supabase
          .from("academy_videos")
          .update(data)
          .eq("id", editingVideo.id);
        if (error) throw error;
        toast.success("Vidéo modifiée");
      } else {
        const { error } = await supabase
          .from("academy_videos")
          .insert({ ...data, module_id: moduleId });
        if (error) throw error;
        toast.success("Vidéo ajoutée");
      }
      setShowVideoForm(null);
      setEditingVideo(null);
      fetchVideos(moduleId);
      // Update module video count
      await updateModuleStats(moduleId);
    } catch (err) {
      toast.error(
        `Erreur : ${err instanceof Error ? err.message : "Échec de la sauvegarde"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteVideo = async (video: AcademyVideo) => {
    if (!confirm(`Supprimer "${video.title}" ?`)) return;
    const { error } = await supabase
      .from("academy_videos")
      .delete()
      .eq("id", video.id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Vidéo supprimée");
      fetchVideos(video.module_id);
      await updateModuleStats(video.module_id);
    }
  };

  const updateModuleStats = async (moduleId: string) => {
    const { data: videos } = await supabase
      .from("academy_videos")
      .select("duration_minutes")
      .eq("module_id", moduleId);

    if (videos) {
      const totalVideos = videos.length;
      const totalDuration = videos.reduce(
        (sum: number, v: { duration_minutes: number | null }) => sum + (v.duration_minutes || 0),
        0,
      );
      await supabase
        .from("academy_modules")
        .update({
          total_videos: totalVideos,
          total_duration_minutes: totalDuration,
        })
        .eq("id", moduleId);
      fetchModules();
    }
  };

  // ── Guards ──
  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <div className="text-center py-20 text-text-muted">Accès refusé</div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Gestion Academy"
        description="Gère les modules et vidéos de formation."
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <a href="/admin">
                <ArrowLeft className="h-4 w-4 mr-1" /> Admin
              </a>
            </Button>
            <Button
              onClick={() => {
                setEditingModule(null);
                setShowModuleForm(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Nouveau module
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="border-border-default/50 bg-bg-secondary/30">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {modules.length}
              </p>
              <p className="text-xs text-text-muted">Modules</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border-default/50 bg-bg-secondary/30">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Video className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {modules.reduce((s, m) => s + (m.total_videos || 0), 0)}
              </p>
              <p className="text-xs text-text-muted">Vidéos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border-default/50 bg-bg-secondary/30">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {Math.round(
                  modules.reduce(
                    (s, m) => s + (m.total_duration_minutes || 0),
                    0,
                  ) / 60,
                )}
                h
              </p>
              <p className="text-xs text-text-muted">Contenu total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module form */}
      {showModuleForm && (
        <div className="mb-6">
          <ModuleForm
            initial={editingModule}
            onSave={saveModule}
            onCancel={() => {
              setShowModuleForm(false);
              setEditingModule(null);
            }}
            saving={saving}
          />
        </div>
      )}

      {/* Modules list */}
      <div className="space-y-3">
        {modules.length === 0 ? (
          <Card className="border-border-default/50 bg-bg-secondary/30">
            <CardContent className="py-16 text-center">
              <BookOpen className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary mb-2">
                Aucun module pour le moment
              </p>
              <Button
                onClick={() => {
                  setEditingModule(null);
                  setShowModuleForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Créer le premier module
              </Button>
            </CardContent>
          </Card>
        ) : (
          modules.map((mod) => {
            const isExpanded = expandedModuleId === mod.id;
            const videos = moduleVideos[mod.id] || [];

            return (
              <Card
                key={mod.id}
                className="border-border-default/50 bg-bg-secondary/30 overflow-hidden"
              >
                {/* Module header */}
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${mod.color || "#34D399"}20`,
                      color: mod.color || "#34D399",
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">
                        {mod.module_name}
                      </span>
                      <Badge variant="default" className="text-[10px]">
                        #{mod.module_order}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted truncate">
                      {mod.total_videos || 0} vidéos ·{" "}
                      {mod.total_duration_minutes || 0} min
                      {mod.module_description &&
                        ` · ${mod.module_description.slice(0, 60)}...`}
                    </p>
                  </div>

                  <div
                    className="flex gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingModule(mod);
                        setShowModuleForm(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteModule(mod.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </button>

                {/* Expanded: videos list */}
                {isExpanded && (
                  <div className="border-t border-border-default bg-bg-primary/30 p-4 space-y-3">
                    {loadingVideos === mod.id ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                      </div>
                    ) : (
                      <>
                        {videos.length === 0 && !showVideoForm && (
                          <p className="text-sm text-text-muted text-center py-4">
                            Aucune vidéo dans ce module
                          </p>
                        )}

                        {videos.map((video) => (
                          <div
                            key={video.id}
                            className="flex items-center gap-3 p-3 rounded-xl border border-border-default/50 bg-bg-secondary/30 hover:border-border-hover/50 transition-all group"
                          >
                            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                              <Video className="h-4 w-4 text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">
                                {video.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-text-muted">
                                <span>#{video.video_order}</span>
                                {video.duration_minutes && (
                                  <>
                                    <span>·</span>
                                    <span>{video.duration_minutes} min</span>
                                  </>
                                )}
                                {video.video_url && (
                                  <>
                                    <span>·</span>
                                    <a
                                      href={video.video_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-accent hover:underline inline-flex items-center gap-0.5"
                                    >
                                      Voir
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </>
                                )}
                                {!video.video_url && (
                                  <>
                                    <span>·</span>
                                    <span className="text-amber-400">
                                      Pas de vidéo
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingVideo(video);
                                  setShowVideoForm(mod.id);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteVideo(video)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* Video form */}
                        {showVideoForm === mod.id && (
                          <VideoForm
                            initial={editingVideo}
                            onSave={(data) => saveVideo(mod.id, data)}
                            onCancel={() => {
                              setShowVideoForm(null);
                              setEditingVideo(null);
                            }}
                            saving={saving}
                          />
                        )}

                        {/* Add video button */}
                        {showVideoForm !== mod.id && (
                          <Button
                            variant="ghost"
                            className="w-full border border-dashed border-border-default hover:border-accent/30"
                            onClick={() => {
                              setEditingVideo(null);
                              setShowVideoForm(mod.id);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Ajouter une
                            vidéo
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
