"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  PlayCircle,
  CheckCircle,
  Lock,
  Loader2,
  ArrowLeft,
  BookOpen,
  Clock,
  Eye,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { VideoPlayer } from "@/components/academy/video-player";
import { ModuleQuiz } from "@/components/academy/module-quiz";

interface AcademyModule {
  id: string;
  module_name: string;
  module_description: string | null;
  module_order: number;
  total_duration_minutes: number;
  icon: string | null;
  color: string | null;
  video_count: number;
  completed_count: number;
}

interface AcademyVideo {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  video_order: number;
  watched: boolean;
  watched_at: string | null;
}

interface ModuleListProps {
  className?: string;
}

function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h${remainder > 0 ? `${remainder}` : ""}`;
}

export function ModuleList({ className }: ModuleListProps) {
  const { user, loading: userLoading } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const [modules, setModules] = React.useState<AcademyModule[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Vue detail module
  const [selectedModule, setSelectedModule] =
    React.useState<AcademyModule | null>(null);
  const [videos, setVideos] = React.useState<AcademyVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = React.useState(false);

  // Video en cours de lecture
  const [activeVideo, setActiveVideo] = React.useState<AcademyVideo | null>(
    null,
  );

  // Quiz
  const [showQuiz, setShowQuiz] = React.useState(false);

  // Progression globale
  const totalVideos = modules.reduce((sum, m) => sum + m.video_count, 0);
  const totalCompleted = modules.reduce((sum, m) => sum + m.completed_count, 0);
  const overallProgress =
    totalVideos > 0 ? Math.round((totalCompleted / totalVideos) * 100) : 0;

  // ---- Fetch modules ----
  const fetchModules = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Récupérer tous les modules
    const { data: modulesData, error: modulesError } = await supabase
      .from("academy_modules")
      .select("*")
      .order("module_order", { ascending: true });

    if (modulesError) {
      toast.error("Impossible de charger les modules");
      setLoading(false);
      return;
    }

    // Récupérer le compte de videos par module
    const { data: videosData } = await supabase
      .from("academy_videos")
      .select("id, module_id");

    // Récupérer la progression de l'utilisateur
    const { data: progressData } = await supabase
      .from("video_progress")
      .select("video_id, watched")
      .eq("user_id", user.id)
      .eq("watched", true);

    const watchedVideoIds = new Set(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((progressData as any[]) ?? []).map((p) => p.video_id),
    );

    // Calculer les counts par module
    const videoCountByModule: Record<string, number> = {};
    const completedCountByModule: Record<string, number> = {};

    for (const video of videosData ?? []) {
      videoCountByModule[video.module_id] =
        (videoCountByModule[video.module_id] || 0) + 1;
      if (watchedVideoIds.has(video.id)) {
        completedCountByModule[video.module_id] =
          (completedCountByModule[video.module_id] || 0) + 1;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedModules: AcademyModule[] = ((modulesData ?? []) as any[]).map(
      (m) => ({
        id: m.id,
        module_name: m.module_name,
        module_description: m.module_description,
        module_order: m.module_order,
        total_duration_minutes: m.total_duration_minutes || 0,
        icon: m.icon,
        color: m.color,
        video_count: videoCountByModule[m.id] || 0,
        completed_count: completedCountByModule[m.id] || 0,
      }),
    );

    setModules(enrichedModules);
    setLoading(false);
  }, [supabase, user]);

  React.useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchModules();
  }, [user, userLoading, fetchModules]);

  // ---- Ouvrir un module (charger ses videos) ----
  const openModule = async (mod: AcademyModule) => {
    setSelectedModule(mod);
    setLoadingVideos(true);
    setActiveVideo(null);
    setShowQuiz(false);

    const { data: videosData, error } = await supabase
      .from("academy_videos")
      .select("*")
      .eq("module_id", mod.id)
      .order("video_order", { ascending: true });

    if (error) {
      toast.error("Impossible de charger les videos");
      setLoadingVideos(false);
      return;
    }

    // Charger la progression
    let progressMap: Record<
      string,
      { watched: boolean; watched_at: string | null }
    > = {};
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const videoIds = ((videosData ?? []) as any[]).map((v) => v.id);
      if (videoIds.length > 0) {
        const { data: progressData } = await supabase
          .from("video_progress")
          .select("video_id, watched, watched_at")
          .eq("user_id", user.id)
          .in("video_id", videoIds);

        for (const p of progressData ?? []) {
          progressMap[p.video_id] = {
            watched: p.watched,
            watched_at: p.watched_at,
          };
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedVideos: AcademyVideo[] = ((videosData ?? []) as any[]).map(
      (v) => ({
        ...v,
        watched: progressMap[v.id]?.watched ?? false,
        watched_at: progressMap[v.id]?.watched_at ?? null,
      }),
    );

    setVideos(enrichedVideos);
    setLoadingVideos(false);

    // Ouvrir la première video non vue ou la première
    const firstUnwatched = enrichedVideos.find((v) => !v.watched);
    if (firstUnwatched) {
      setActiveVideo(firstUnwatched);
    } else if (enrichedVideos.length > 0) {
      setActiveVideo(enrichedVideos[0]);
    }
  };

  // ---- Marquer une video comme vue ----
  const markVideoWatched = async (videoId: string) => {
    if (!user) return;

    // Mise à jour optimiste
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? { ...v, watched: true, watched_at: new Date().toISOString() }
          : v,
      ),
    );

    // Upsert dans video_progress
    const { error } = await supabase.from("video_progress").upsert(
      {
        user_id: user.id,
        video_id: videoId,
        watched: true,
        watched_at: new Date().toISOString(),
        watch_percentage: 100,
      },
      { onConflict: "user_id,video_id" },
    );

    if (error) {
      // Rollback
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId ? { ...v, watched: false, watched_at: null } : v,
        ),
      );
      toast.error("Impossible de sauvegarder la progression");
      return;
    }

    // Mettre à jour les compteurs du module
    if (selectedModule) {
      const newCompletedCount = selectedModule.completed_count + 1;
      setModules((prev) =>
        prev.map((m) =>
          m.id === selectedModule.id
            ? { ...m, completed_count: newCompletedCount }
            : m,
        ),
      );

      // Celebration si module termine
      if (newCompletedCount >= selectedModule.video_count) {
        toast.success(
          `Module "${selectedModule.module_name}" termine ! Bravo !`,
        );
      } else {
        toast.success("Vidéo marquée comme vue !");
      }
    } else {
      toast.success("Vidéo marquée comme vue !");
    }
  };

  // ---- Retour à la liste ----
  const goBack = () => {
    setSelectedModule(null);
    setVideos([]);
    setActiveVideo(null);
    setShowQuiz(false);
    fetchModules(); // Rafraichir les compteurs
  };

  // ---- Etat de chargement ----
  if (loading || userLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  // ---- Vue detail d'un module ----
  if (selectedModule) {
    const moduleProgress =
      selectedModule.video_count > 0
        ? Math.round(
            (videos.filter((v) => v.watched).length /
              selectedModule.video_count) *
              100,
          )
        : 0;

    return (
      <div className={cn("space-y-6", className)}>
        {/* Header du module */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text-primary">
              {selectedModule.module_name}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-text-muted">
                {videos.filter((v) => v.watched).length}/{videos.length} videos
                vues
              </span>
              <Progress
                value={moduleProgress}
                className="h-1.5 max-w-[120px]"
              />
              <span className="text-xs text-text-muted">{moduleProgress}%</span>
            </div>
          </div>
          <Button
            variant={showQuiz ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowQuiz(!showQuiz)}
            className="gap-2 shrink-0"
          >
            <Trophy className="h-4 w-4" />
            {showQuiz ? "Masquer le quiz" : "Quiz"}
          </Button>
        </div>

        {showQuiz && (
          <ModuleQuiz
            moduleId={selectedModule.id}
            moduleTitle={selectedModule.module_name}
            onComplete={(score, total, passed) => {
              if (passed) {
                toast.success(`Quiz réussi ! ${score}/${total}`);
              }
            }}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Lecteur video */}
          <div className="lg:col-span-2 space-y-4">
            {activeVideo ? (
              <>
                <VideoPlayer
                  videoUrl={activeVideo.video_url || undefined}
                  title={activeVideo.title}
                />
                {activeVideo.description && (
                  <p className="text-sm text-text-secondary">
                    {activeVideo.description}
                  </p>
                )}
                {!activeVideo.watched && (
                  <Button
                    onClick={() => markVideoWatched(activeVideo.id)}
                    size="sm"
                  >
                    <Eye className="h-4 w-4" />
                    Marquer comme vue
                  </Button>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-sm text-text-muted">
                    Sélectionne une video dans la liste
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Liste des videos du module */}
          <div className="space-y-2">
            {loadingVideos ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
              </div>
            ) : videos.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">
                Aucune video dans ce module.
              </p>
            ) : (
              videos.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => setActiveVideo(video)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl transition-all flex items-center gap-3",
                    activeVideo?.id === video.id
                      ? "bg-accent/10 border border-accent/30"
                      : "bg-bg-tertiary hover:bg-bg-tertiary/80 border border-transparent",
                  )}
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center">
                    {video.watched ? (
                      <CheckCircle className="h-5 w-5 text-accent" />
                    ) : (
                      <span className="text-xs font-medium text-text-muted">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        video.watched ? "text-text-muted" : "text-text-primary",
                      )}
                    >
                      {video.title}
                    </p>
                    {video.duration_minutes && (
                      <span className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDuration(video.duration_minutes)}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- Vue liste des modules ----
  return (
    <div className={cn("space-y-6", className)}>
      {/* Barre de progression globale */}
      {totalVideos > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium text-text-primary">
                  Progression globale
                </span>
              </div>
              <span className="text-sm font-semibold text-accent">
                {overallProgress}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <p className="text-xs text-text-muted mt-2">
              {totalCompleted}/{totalVideos} videos terminées
            </p>
          </CardContent>
        </Card>
      )}

      {/* Liste des modules */}
      {modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-10 w-10 text-text-muted/40 mb-3" />
          <p className="text-sm text-text-muted">
            Aucun module disponible pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((mod) => {
            const progress =
              mod.video_count > 0
                ? (mod.completed_count / mod.video_count) * 100
                : 0;
            const isCompleted =
              mod.video_count > 0 && mod.completed_count === mod.video_count;
            const isInProgress = mod.completed_count > 0 && !isCompleted;

            return (
              <Card
                key={mod.id}
                className="cursor-pointer transition-all hover:border-border-hover"
                onClick={() => openModule(mod)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                        isCompleted
                          ? "bg-accent/15"
                          : isInProgress
                            ? "bg-accent/15"
                            : "bg-info/15",
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6 text-accent" />
                      ) : (
                        <PlayCircle className="h-6 w-6 text-accent" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-text-primary">
                          {mod.module_name}
                        </h3>
                        {isInProgress && (
                          <Badge variant="default">En cours</Badge>
                        )}
                        {isCompleted && <Badge variant="cyan">Termine</Badge>}
                      </div>
                      <p className="text-sm text-text-secondary mb-3">
                        {mod.module_description}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-text-muted">
                          {mod.video_count} lecons
                        </span>
                        {mod.total_duration_minutes > 0 && (
                          <span className="text-xs text-text-muted">
                            {formatDuration(mod.total_duration_minutes)}
                          </span>
                        )}
                        {mod.video_count > 0 && (
                          <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                            <Progress value={progress} className="h-1.5" />
                            <span className="text-xs text-text-muted">
                              {Math.round(progress)}%
                            </span>
                          </div>
                        )}
                      </div>
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
