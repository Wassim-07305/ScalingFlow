"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  Filter,
  Award,
  Calendar,
  Zap,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

const CATEGORIES = [
  "Tous",
  "Victoires",
  "Questions",
  "Ressources",
  "Feedback",
] as const;

type Category = (typeof CATEGORIES)[number];

interface PostProfile {
  full_name: string | null;
  avatar_url: string | null;
  niche?: string | null;
  experience_level?: string | null;
  xp_points?: number;
  badges?: string[] | null;
  created_at?: string;
}

interface Post {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  category: string | null;
  likes_count: number;
  comments_count: number;
  pinned: boolean;
  created_at: string;
  profiles: PostProfile | null;
  liked_by_me: boolean;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: PostProfile | null;
}

interface PostFeedProps {
  className?: string;
}

// ─── Mini Profile Card ─────────────────────────────────────────
interface MiniProfileProps {
  userId: string;
  profile: PostProfile | null;
  onClose: () => void;
}

function MiniProfileCard({ userId, profile, onClose }: MiniProfileProps) {
  const [fullProfile, setFullProfile] = React.useState<{
    full_name: string | null;
    avatar_url: string | null;
    niche: string | null;
    experience_level: string | null;
    xp_points: number;
    badges: string[] | null;
    created_at: string;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const supabase = createClient();
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, niche, experience_level, xp_points, badges, created_at")
        .eq("id", userId)
        .single();

      if (data) {
        setFullProfile({
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          niche: data.niche,
          experience_level: data.experience_level,
          xp_points: data.xp_points ?? 0,
          badges: data.badges as string[] | null,
          created_at: data.created_at,
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [userId, supabase]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "??";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const experienceLabels: Record<string, string> = {
    beginner: "Débutant",
    intermediate: "Intermédiaire",
    advanced: "Avancé",
  };

  const displayProfile = fullProfile || {
    full_name: profile?.full_name || "Membre ScalingFlow",
    avatar_url: profile?.avatar_url || null,
    niche: null,
    experience_level: null,
    xp_points: 0,
    badges: null,
    created_at: new Date().toISOString(),
  };

  return (
    <div
      ref={cardRef}
      className="absolute z-50 top-full left-0 mt-2 w-72 bg-bg-secondary border border-border-default rounded-xl shadow-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-12 w-12">
              {displayProfile.avatar_url && (
                <AvatarImage src={displayProfile.avatar_url} />
              )}
              <AvatarFallback className="bg-bg-tertiary text-text-secondary text-sm">
                {getInitials(displayProfile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {displayProfile.full_name || "Membre ScalingFlow"}
              </p>
              {displayProfile.niche && (
                <p className="text-xs text-accent truncate">{displayProfile.niche}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 text-text-muted hover:text-text-primary rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {displayProfile.experience_level && (
              <div className="text-center p-2 bg-bg-tertiary rounded-lg">
                <Award className="h-3.5 w-3.5 text-accent mx-auto mb-1" />
                <p className="text-[10px] text-text-muted">Niveau</p>
                <p className="text-xs font-medium text-text-primary">
                  {experienceLabels[displayProfile.experience_level] || displayProfile.experience_level}
                </p>
              </div>
            )}
            <div className="text-center p-2 bg-bg-tertiary rounded-lg">
              <Zap className="h-3.5 w-3.5 text-yellow-400 mx-auto mb-1" />
              <p className="text-[10px] text-text-muted">XP</p>
              <p className="text-xs font-medium text-text-primary">
                {displayProfile.xp_points.toLocaleString("fr-FR")}
              </p>
            </div>
            <div className="text-center p-2 bg-bg-tertiary rounded-lg">
              <Award className="h-3.5 w-3.5 text-cyan-400 mx-auto mb-1" />
              <p className="text-[10px] text-text-muted">Badges</p>
              <p className="text-xs font-medium text-text-primary">
                {displayProfile.badges?.length || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-text-muted mb-3">
            <Calendar className="h-3 w-3" />
            <span>
              Membre depuis{" "}
              {format(new Date(displayProfile.created_at), "MMMM yyyy", { locale: fr })}
            </span>
          </div>

          <a
            href={`/leaderboard`}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-bg-tertiary hover:bg-accent/10 text-xs text-text-secondary hover:text-accent transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Voir le profil
          </a>
        </>
      )}
    </div>
  );
}

// ─── Main PostFeed component ───────────────────────────────────
export function PostFeed({ className }: PostFeedProps) {
  const { user, profile } = useUser();
  const supabase = createClient();

  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeCategory, setActiveCategory] = React.useState<Category>("Tous");

  // Recherche et filtrage
  const [searchQuery, setSearchQuery] = React.useState("");
  const [nicheFilter, setNicheFilter] = React.useState<string>("all");
  const [availableNiches, setAvailableNiches] = React.useState<string[]>([]);
  const [showFilters, setShowFilters] = React.useState(false);

  // Mini profil
  const [activeProfileUserId, setActiveProfileUserId] = React.useState<string | null>(null);
  const [activeProfileData, setActiveProfileData] = React.useState<PostProfile | null>(null);

  // Nouveau post
  const [newContent, setNewContent] = React.useState("");
  const [newCategory, setNewCategory] = React.useState<string>("Questions");
  const [submitting, setSubmitting] = React.useState(false);

  // Commentaires
  const [expandedComments, setExpandedComments] = React.useState<Set<string>>(
    new Set()
  );
  const [comments, setComments] = React.useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = React.useState<
    Record<string, string>
  >({});
  const [loadingComments, setLoadingComments] = React.useState<Set<string>>(
    new Set()
  );
  const [submittingComment, setSubmittingComment] = React.useState<Set<string>>(
    new Set()
  );

  // Likes en cours
  const [likingPosts, setLikingPosts] = React.useState<Set<string>>(new Set());

  // Edition post
  const [editingPostId, setEditingPostId] = React.useState<string | null>(null);
  const [editPostContent, setEditPostContent] = React.useState("");

  // Edition commentaire
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = React.useState("");

  // ---- Fetch posts ----
  const fetchPosts = React.useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("community_posts")
      .select("*, profiles:user_id(full_name, avatar_url, niche, experience_level, xp_points, badges, created_at)")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Impossible de charger les posts");
      setLoading(false);
      return;
    }

    // Vérifier les likes de l'utilisateur courant
    let likedPostIds: Set<string> = new Set();
    if (user) {
      const { data: likes } = await supabase
        .from("community_likes")
        .select("post_id")
        .eq("user_id", user.id);

      if (likes) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        likedPostIds = new Set((likes as any[]).map((l: any) => l.post_id));
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postsWithLikes: Post[] = ((data ?? []) as any[]).map((p: any) => ({
      ...p,
      profiles: p.profiles as unknown as PostProfile | null,
      liked_by_me: likedPostIds.has(p.id),
    }));

    setPosts(postsWithLikes);

    // Extraire les niches uniques
    const niches = new Set<string>();
    postsWithLikes.forEach((p) => {
      if (p.profiles?.niche) {
        niches.add(p.profiles.niche);
      }
    });
    setAvailableNiches(Array.from(niches).sort());

    setLoading(false);
  }, [supabase, user]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ---- Filtrage par catégorie, niche et recherche ----
  const filteredPosts = React.useMemo(() => {
    let result = posts;

    // Catégorie
    if (activeCategory !== "Tous") {
      result = result.filter((p) => p.category === activeCategory);
    }

    // Niche
    if (nicheFilter !== "all") {
      result = result.filter((p) => p.profiles?.niche === nicheFilter);
    }

    // Recherche texte
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.profiles?.full_name && p.profiles.full_name.toLowerCase().includes(q))
      );
    }

    return result;
  }, [posts, activeCategory, nicheFilter, searchQuery]);

  // ---- Post counts per filter ----
  const postCountByCategory = React.useMemo(() => {
    const counts: Record<string, number> = { Tous: posts.length };
    posts.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [posts]);

  // ---- Créer un post ----
  const handleSubmitPost = async () => {
    if (!newContent.trim() || !user) return;
    setSubmitting(true);

    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      content: newContent.trim(),
      category: newCategory,
      likes_count: 0,
      comments_count: 0,
      pinned: false,
    });

    if (error) {
      toast.error("Impossible de publier le post");
      setSubmitting(false);
      return;
    }

    toast.success("Post publié !");
    // Attribuer XP (non bloquant)
    fetch("/api/gamification/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityType: "community.post" }),
    }).catch(() => {});
    setNewContent("");
    setSubmitting(false);
    await fetchPosts();
  };

  // ---- Like / Unlike ----
  const toggleLike = async (postId: string) => {
    if (!user) return;
    if (likingPosts.has(postId)) return;

    setLikingPosts((prev) => new Set(prev).add(postId));

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const wasLiked = post.liked_by_me;

    // Mise à jour optimiste
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked_by_me: !wasLiked,
              likes_count: wasLiked
                ? Math.max(0, p.likes_count - 1)
                : p.likes_count + 1,
            }
          : p
      )
    );

    if (wasLiked) {
      const { error } = await supabase
        .from("community_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (!error) {
        await supabase
          .from("community_posts")
          .update({ likes_count: Math.max(0, post.likes_count - 1) })
          .eq("id", postId);
      } else {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, liked_by_me: true, likes_count: post.likes_count }
              : p
          )
        );
        toast.error("Erreur lors du unlike");
      }
    } else {
      const { error } = await supabase
        .from("community_likes")
        .insert({ post_id: postId, user_id: user.id });

      if (!error) {
        await supabase
          .from("community_posts")
          .update({ likes_count: post.likes_count + 1 })
          .eq("id", postId);
      } else {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, liked_by_me: false, likes_count: post.likes_count }
              : p
          )
        );
        toast.error("Erreur lors du like");
      }
    }

    setLikingPosts((prev) => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
  };

  // ---- Charger les commentaires ----
  const toggleComments = async (postId: string) => {
    const isExpanded = expandedComments.has(postId);

    if (isExpanded) {
      setExpandedComments((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
      return;
    }

    setExpandedComments((prev) => new Set(prev).add(postId));

    if (comments[postId]) return;

    setLoadingComments((prev) => new Set(prev).add(postId));

    const { data, error } = await supabase
      .from("community_comments")
      .select("*, profiles:user_id(full_name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Impossible de charger les commentaires");
    } else {
      setComments((prev) => ({
        ...prev,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [postId]: ((data ?? []) as any[]).map((c: any) => ({
          ...c,
          profiles: c.profiles as unknown as PostProfile | null,
        })),
      }));
    }

    setLoadingComments((prev) => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
  };

  // ---- Poster un commentaire ----
  const handleSubmitComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content || !user) return;

    setSubmittingComment((prev) => new Set(prev).add(postId));

    const { data, error } = await supabase
      .from("community_comments")
      .insert({ post_id: postId, user_id: user.id, content })
      .select("*, profiles:user_id(full_name, avatar_url)")
      .single();

    if (error) {
      toast.error("Impossible de poster le commentaire");
      setSubmittingComment((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
      return;
    }

    const newComment: Comment = {
      ...data,
      profiles: data.profiles as unknown as PostProfile | null,
    };
    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));

    fetch("/api/gamification/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityType: "community.comment" }),
    }).catch(() => {});

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
      )
    );

    const post = posts.find((p) => p.id === postId);
    if (post) {
      await supabase
        .from("community_posts")
        .update({ comments_count: post.comments_count + 1 })
        .eq("id", postId);
    }

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    setSubmittingComment((prev) => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
  };

  // ---- Editer un post ----
  const handleEditPost = async (postId: string) => {
    if (!editPostContent.trim()) return;
    const { error } = await supabase
      .from("community_posts")
      .update({ content: editPostContent.trim() })
      .eq("id", postId);

    if (error) {
      toast.error("Impossible de modifier le post");
      return;
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, content: editPostContent.trim() } : p
      )
    );
    setEditingPostId(null);
    toast.success("Post modifié");
  };

  // ---- Supprimer un post ----
  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      toast.error("Impossible de supprimer le post");
      return;
    }

    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast.success("Post supprimé");
  };

  // ---- Editer un commentaire ----
  const handleEditComment = async (commentId: string, postId: string) => {
    if (!editCommentContent.trim()) return;
    const { error } = await supabase
      .from("community_comments")
      .update({ content: editCommentContent.trim() })
      .eq("id", commentId);

    if (error) {
      toast.error("Impossible de modifier le commentaire");
      return;
    }

    setComments((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).map((c) =>
        c.id === commentId ? { ...c, content: editCommentContent.trim() } : c
      ),
    }));
    setEditingCommentId(null);
    toast.success("Commentaire modifié");
  };

  // ---- Supprimer un commentaire ----
  const handleDeleteComment = async (commentId: string, postId: string) => {
    const { error } = await supabase
      .from("community_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      toast.error("Impossible de supprimer le commentaire");
      return;
    }

    setComments((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
    }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments_count: Math.max(0, p.comments_count - 1) }
          : p
      )
    );

    const post = posts.find((p) => p.id === postId);
    if (post) {
      await supabase
        .from("community_posts")
        .update({ comments_count: Math.max(0, post.comments_count - 1) })
        .eq("id", postId);
    }

    toast.success("Commentaire supprimé");
  };

  // ---- Helpers d'affichage ----
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const categoryColor: Record<
    string,
    "default" | "blue" | "cyan" | "purple" | "muted"
  > = {
    Victoires: "cyan",
    Questions: "blue",
    Ressources: "default",
    Feedback: "purple",
  };

  // ---- Loading state ----
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Barre de recherche et filtres */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Rechercher dans les posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5"
            >
              <Filter className="h-4 w-4" />
              Filtres
            </Button>
          </div>

          {showFilters && (
            <div className="flex items-center gap-3 pt-2 border-t border-border-default">
              <div className="flex-1">
                <Select value={nicheFilter} onValueChange={setNicheFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Filtrer par niche" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les niches</SelectItem>
                    {availableNiches.map((niche) => (
                      <SelectItem key={niche} value={niche}>
                        {niche}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(nicheFilter !== "all" || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNicheFilter("all");
                    setSearchQuery("");
                  }}
                  className="text-xs text-text-muted"
                >
                  <X className="h-3 w-3 mr-1" />
                  Réinitialiser
                </Button>
              )}
            </div>
          )}

          {/* Résultat du filtre */}
          {(searchQuery || nicheFilter !== "all") && (
            <p className="text-xs text-text-muted mt-2">
              {filteredPosts.length} post{filteredPosts.length !== 1 ? "s" : ""} trouvé{filteredPosts.length !== 1 ? "s" : ""}
              {nicheFilter !== "all" && ` dans la niche "${nicheFilter}"`}
              {searchQuery && ` pour "${searchQuery}"`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Nouveau post */}
      {user && (
        <Card>
          <CardContent className="pt-6">
            <Textarea
              placeholder="Partage une victoire, pose une question..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="mb-3"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {(
                  ["Victoires", "Questions", "Ressources", "Feedback"] as const
                ).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                      newCategory === cat
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                onClick={handleSubmitPost}
                disabled={!newContent.trim() || submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Publier
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres par catégorie */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
              activeCategory === cat
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            {cat}
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full",
                activeCategory === cat
                  ? "bg-white/20"
                  : "bg-bg-secondary"
              )}
            >
              {postCountByCategory[cat] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Liste des posts */}
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="h-10 w-10 text-text-muted/40 mb-3" />
          <p className="text-sm text-text-muted">
            {searchQuery || nicheFilter !== "all"
              ? "Aucun post ne correspond à vos filtres."
              : "Aucun post dans cette catégorie pour le moment."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const displayName =
              post.profiles?.full_name || "Membre ScalingFlow";
            const avatarUrl = post.profiles?.avatar_url;
            const initials = getInitials(post.profiles?.full_name);
            const isCommentsExpanded = expandedComments.has(post.id);
            const postComments = comments[post.id] || [];
            const isLoadingComments = loadingComments.has(post.id);

            return (
              <Card key={post.id}>
                <CardContent className="pt-6">
                  {/* Auteur */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-9 w-9">
                      {avatarUrl && <AvatarImage src={avatarUrl} />}
                      <AvatarFallback className="bg-bg-tertiary text-text-secondary text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 relative">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (activeProfileUserId === post.user_id) {
                              setActiveProfileUserId(null);
                            } else {
                              setActiveProfileUserId(post.user_id);
                              setActiveProfileData(post.profiles);
                            }
                          }}
                          className="text-sm font-medium text-text-primary hover:text-accent transition-colors cursor-pointer"
                        >
                          {displayName}
                        </button>
                        {post.pinned && (
                          <Badge variant="default" className="text-[10px]">
                            Épinglé
                          </Badge>
                        )}
                        {post.profiles?.niche && (
                          <span className="text-[10px] text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">
                            {post.profiles.niche}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-muted">
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                      {/* Mini profile card */}
                      {activeProfileUserId === post.user_id && (
                        <MiniProfileCard
                          userId={post.user_id}
                          profile={post.profiles}
                          onClose={() => setActiveProfileUserId(null)}
                        />
                      )}
                    </div>
                    {post.category && (
                      <Badge
                        variant={categoryColor[post.category] || "muted"}
                      >
                        {post.category}
                      </Badge>
                    )}
                    {user && user.id === post.user_id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button aria-label="Options du post" className="p-1 rounded-lg text-text-muted hover:bg-bg-tertiary hover:text-text-primary transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingPostId(post.id);
                              setEditPostContent(post.content);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-danger focus:text-danger"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Titre */}
                  {post.title && (
                    <h3 className="font-semibold text-text-primary mb-1">
                      {post.title}
                    </h3>
                  )}

                  {/* Contenu */}
                  {editingPostId === post.id ? (
                    <div className="mb-4">
                      <Textarea
                        value={editPostContent}
                        onChange={(e) => setEditPostContent(e.target.value)}
                        className="mb-2"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditPost(post.id)}
                          disabled={!editPostContent.trim()}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Enregistrer
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingPostId(null)}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary mb-4 whitespace-pre-wrap">
                      {post.content}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-3 border-t border-border-default">
                    <button
                      onClick={() => toggleLike(post.id)}
                      disabled={!user || likingPosts.has(post.id)}
                      aria-label={post.liked_by_me ? "Retirer le like" : "Aimer ce post"}
                      className={cn(
                        "flex items-center gap-1.5 text-sm transition-colors",
                        post.liked_by_me
                          ? "text-danger"
                          : "text-text-muted hover:text-danger"
                      )}
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4",
                          post.liked_by_me && "fill-current"
                        )}
                      />
                      {post.likes_count}
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      aria-label={isCommentsExpanded ? "Masquer les commentaires" : "Afficher les commentaires"}
                      aria-expanded={isCommentsExpanded}
                      className="flex items-center gap-1.5 text-sm text-text-muted hover:text-info transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {post.comments_count}
                      {isCommentsExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                    <button aria-label="Partager ce post" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors">
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Section commentaires */}
                  {isCommentsExpanded && (
                    <div className="mt-4 pt-3 border-t border-border-default space-y-3">
                      {isLoadingComments ? (
                        <div className="flex justify-center py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                        </div>
                      ) : (
                        <>
                          {postComments.length === 0 && (
                            <p className="text-xs text-text-muted text-center py-2">
                              Aucun commentaire pour le moment.
                            </p>
                          )}
                          {postComments.map((comment) => {
                            const cName =
                              comment.profiles?.full_name ||
                              "Membre ScalingFlow";
                            const cInitials = getInitials(
                              comment.profiles?.full_name
                            );
                            const cAvatar = comment.profiles?.avatar_url;

                            return (
                              <div
                                key={comment.id}
                                className="flex gap-2.5 pl-2 group"
                              >
                                <Avatar className="h-7 w-7 flex-shrink-0">
                                  {cAvatar && <AvatarImage src={cAvatar} />}
                                  <AvatarFallback className="bg-bg-tertiary text-text-secondary text-[10px]">
                                    {cInitials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-bg-tertiary rounded-xl px-3 py-2">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <button
                                      onClick={() => {
                                        if (activeProfileUserId === comment.user_id) {
                                          setActiveProfileUserId(null);
                                        } else {
                                          setActiveProfileUserId(comment.user_id);
                                          setActiveProfileData(comment.profiles);
                                        }
                                      }}
                                      className="text-xs font-medium text-text-primary hover:text-accent transition-colors"
                                    >
                                      {cName}
                                    </button>
                                    <span className="text-[10px] text-text-muted">
                                      {formatDistanceToNow(
                                        new Date(comment.created_at),
                                        { addSuffix: true, locale: fr }
                                      )}
                                    </span>
                                    {user && user.id === comment.user_id && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button aria-label="Options du commentaire" className="p-0.5 rounded text-text-muted opacity-0 group-hover:opacity-100 hover:text-text-primary transition-all">
                                            <MoreHorizontal className="h-3 w-3" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setEditingCommentId(comment.id);
                                              setEditCommentContent(comment.content);
                                            }}
                                          >
                                            <Pencil className="h-3 w-3 mr-2" />
                                            Modifier
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            className="text-danger focus:text-danger"
                                            onClick={() =>
                                              handleDeleteComment(comment.id, post.id)
                                            }
                                          >
                                            <Trash2 className="h-3 w-3 mr-2" />
                                            Supprimer
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                  {editingCommentId === comment.id ? (
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <Input
                                        value={editCommentContent}
                                        onChange={(e) =>
                                          setEditCommentContent(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleEditComment(comment.id, post.id);
                                          }
                                          if (e.key === "Escape") {
                                            setEditingCommentId(null);
                                          }
                                        }}
                                        className="h-6 text-xs"
                                      />
                                      <button
                                        onClick={() =>
                                          handleEditComment(comment.id, post.id)
                                        }
                                        aria-label="Confirmer la modification"
                                        className="text-accent hover:text-accent/80"
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setEditingCommentId(null)}
                                        aria-label="Annuler la modification"
                                        className="text-text-muted hover:text-text-primary"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-text-secondary">
                                      {comment.content}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}

                      {/* Formulaire nouveau commentaire */}
                      {user && (
                        <div className="flex gap-2 pl-2">
                          <Input
                            placeholder="Écrire un commentaire..."
                            value={commentInputs[post.id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmitComment(post.id);
                              }
                            }}
                            className="h-8 text-xs"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSubmitComment(post.id)}
                            disabled={
                              !commentInputs[post.id]?.trim() ||
                              submittingComment.has(post.id)
                            }
                          >
                            {submittingComment.has(post.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
