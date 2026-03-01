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
  Heart,
  MessageCircle,
  Share2,
  Send,
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
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
  display_name: string | null;
  avatar_url: string | null;
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

export function PostFeed({ className }: PostFeedProps) {
  const { user, profile } = useUser();
  const supabase = createClient();

  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeCategory, setActiveCategory] = React.useState<Category>("Tous");

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

  // ---- Fetch posts ----
  const fetchPosts = React.useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("community_posts")
      .select("*, profiles:user_id(display_name, avatar_url)")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Impossible de charger les posts");
      setLoading(false);
      return;
    }

    // Verifier les likes de l'utilisateur courant
    let likedPostIds: Set<string> = new Set();
    if (user) {
      const { data: likes } = await supabase
        .from("community_likes")
        .select("post_id")
        .eq("user_id", user.id);

      if (likes) {
        likedPostIds = new Set(likes.map((l) => l.post_id));
      }
    }

    const postsWithLikes: Post[] = (data ?? []).map((p) => ({
      ...p,
      profiles: p.profiles as unknown as PostProfile | null,
      liked_by_me: likedPostIds.has(p.id),
    }));

    setPosts(postsWithLikes);
    setLoading(false);
  }, [supabase, user]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ---- Filtrage par categorie ----
  const filteredPosts =
    activeCategory === "Tous"
      ? posts
      : posts.filter((p) => p.category === activeCategory);

  // ---- Creer un post ----
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

    toast.success("Post publie !");
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

    // Mise a jour optimiste
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
      // Unlike
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
        // Rollback
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
      // Like
      const { error } = await supabase
        .from("community_likes")
        .insert({ post_id: postId, user_id: user.id });

      if (!error) {
        await supabase
          .from("community_posts")
          .update({ likes_count: post.likes_count + 1 })
          .eq("id", postId);
      } else {
        // Rollback
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

    if (comments[postId]) return; // Deja charge

    setLoadingComments((prev) => new Set(prev).add(postId));

    const { data, error } = await supabase
      .from("community_comments")
      .select("*, profiles:user_id(display_name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Impossible de charger les commentaires");
    } else {
      setComments((prev) => ({
        ...prev,
        [postId]: (data ?? []).map((c) => ({
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
      .select("*, profiles:user_id(display_name, avatar_url)")
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

    // Ajouter le commentaire en local
    const newComment: Comment = {
      ...data,
      profiles: data.profiles as unknown as PostProfile | null,
    };
    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));

    // Mettre a jour le compteur
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
      )
    );

    // Mettre a jour le compteur en DB
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

      {/* Filtres par categorie */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              activeCategory === cat
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Liste des posts */}
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="h-10 w-10 text-text-muted/40 mb-3" />
          <p className="text-sm text-text-muted">
            Aucun post dans cette categorie pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const displayName =
              post.profiles?.display_name || "Membre ScalingFlow";
            const avatarUrl = post.profiles?.avatar_url;
            const initials = getInitials(post.profiles?.display_name);
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
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">
                          {displayName}
                        </span>
                        {post.pinned && (
                          <Badge variant="default" className="text-[10px]">
                            Epingle
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-text-muted">
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                    {post.category && (
                      <Badge
                        variant={categoryColor[post.category] || "muted"}
                      >
                        {post.category}
                      </Badge>
                    )}
                  </div>

                  {/* Titre */}
                  {post.title && (
                    <h3 className="font-semibold text-text-primary mb-1">
                      {post.title}
                    </h3>
                  )}

                  {/* Contenu */}
                  <p className="text-sm text-text-secondary mb-4 whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-3 border-t border-border-default">
                    <button
                      onClick={() => toggleLike(post.id)}
                      disabled={!user || likingPosts.has(post.id)}
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
                    <button className="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors">
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
                              comment.profiles?.display_name ||
                              "Membre ScalingFlow";
                            const cInitials = getInitials(
                              comment.profiles?.display_name
                            );
                            const cAvatar = comment.profiles?.avatar_url;

                            return (
                              <div
                                key={comment.id}
                                className="flex gap-2.5 pl-2"
                              >
                                <Avatar className="h-7 w-7 flex-shrink-0">
                                  {cAvatar && <AvatarImage src={cAvatar} />}
                                  <AvatarFallback className="bg-bg-tertiary text-text-secondary text-[10px]">
                                    {cInitials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-bg-tertiary rounded-xl px-3 py-2">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-medium text-text-primary">
                                      {cName}
                                    </span>
                                    <span className="text-[10px] text-text-muted">
                                      {formatDistanceToNow(
                                        new Date(comment.created_at),
                                        { addSuffix: true, locale: fr }
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-xs text-text-secondary">
                                    {comment.content}
                                  </p>
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
                            placeholder="Ecrire un commentaire..."
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
