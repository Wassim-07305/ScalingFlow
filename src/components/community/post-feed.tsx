"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart,
  MessageCircle,
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
  ImagePlus,
  Smile,
  Pin,
  Bookmark,
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

// ─── Constants ──────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "Tous", emoji: "" },
  { id: "wins", label: "Victoires", emoji: "🏆" },
  { id: "questions", label: "Questions", emoji: "❓" },
  { id: "general", label: "Général", emoji: "💬" },
  { id: "feedback", label: "Feedback", emoji: "📝" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

// DB categories for the post composer (excludes "all" filter)
const POST_CATEGORIES = CATEGORIES.filter((c) => c.id !== "all");

const CATEGORY_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  wins: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  questions: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
  },
  general: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
  feedback: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
  },
};

// ─── Types ──────────────────────────────────────────────────
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

// ─── Helpers ────────────────────────────────────────────────
function getInitials(name: string | null | undefined) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
  expert: "Expert",
};

// ─── Mini Profile Card ──────────────────────────────────────
function MiniProfileCard({
  userId,
  profile,
  onClose,
}: {
  userId: string;
  profile: PostProfile | null;
  onClose: () => void;
}) {
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
  const supabase = React.useMemo(() => createClient(), []);
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "full_name, avatar_url, niche, experience_level, xp_points, badges, created_at",
        )
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

  const dp = fullProfile || {
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
      className="absolute z-50 top-full left-0 mt-2 w-80 bg-bg-secondary border border-border-default rounded-2xl shadow-2xl shadow-black/20 p-5 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
        </div>
      ) : (
        <>
          {/* Header with gradient */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-14 w-14 ring-2 ring-accent/20">
              {dp.avatar_url && <AvatarImage src={dp.avatar_url} />}
              <AvatarFallback className="bg-accent/10 text-accent text-sm font-bold">
                {getInitials(dp.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary truncate">
                {dp.full_name || "Membre ScalingFlow"}
              </p>
              {dp.niche && (
                <p className="text-xs text-accent truncate">{dp.niche}</p>
              )}
              {dp.experience_level && (
                <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                  {EXPERIENCE_LABELS[dp.experience_level] ||
                    dp.experience_level}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2.5 bg-bg-tertiary rounded-xl">
              <Zap className="h-4 w-4 text-yellow-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-text-primary">
                {dp.xp_points.toLocaleString("fr-FR")}
              </p>
              <p className="text-[10px] text-text-muted">XP</p>
            </div>
            <div className="text-center p-2.5 bg-bg-tertiary rounded-xl">
              <Award className="h-4 w-4 text-cyan-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-text-primary">
                {dp.badges?.length || 0}
              </p>
              <p className="text-[10px] text-text-muted">Badges</p>
            </div>
            <div className="text-center p-2.5 bg-bg-tertiary rounded-xl">
              <Calendar className="h-4 w-4 text-accent mx-auto mb-1" />
              <p className="text-xs font-bold text-text-primary">
                {format(new Date(dp.created_at), "MMM yy", { locale: fr })}
              </p>
              <p className="text-[10px] text-text-muted">Membre</p>
            </div>
          </div>

          <a
            href="/leaderboard"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-accent/10 hover:bg-accent/20 text-xs font-medium text-accent transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Voir le profil complet
          </a>
        </>
      )}
    </div>
  );
}

// ─── Post Composer ──────────────────────────────────────────
function PostComposer({
  profile,
  onSubmit,
}: {
  profile: PostProfile | null;
  onSubmit: (content: string, category: string) => Promise<void>;
}) {
  const [content, setContent] = React.useState("");
  const [category, setCategory] = React.useState("questions");
  const [submitting, setSubmitting] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    await onSubmit(content.trim(), category);
    setContent("");
    setSubmitting(false);
    setFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-bg-secondary/80 backdrop-blur-sm transition-all duration-300",
        focused
          ? "border-accent/40 shadow-lg shadow-accent/5"
          : "border-border-default",
      )}
    >
      <div className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
            <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              placeholder="Partage une victoire, pose une question, aide la communauté..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setFocused(true)}
              onKeyDown={handleKeyDown}
              rows={focused ? 3 : 1}
              className="w-full resize-none bg-transparent text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bottom bar — shown when focused or has content */}
      {(focused || content) && (
        <div className="flex items-center justify-between border-t border-border-default px-4 py-3">
          <div className="flex items-center gap-1.5">
            {POST_CATEGORIES.map((cat) => {
              const style = CATEGORY_STYLES[cat.id];
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                    category === cat.id
                      ? `${style?.bg} ${style?.text} ${style?.border}`
                      : "border-transparent text-text-muted hover:text-text-secondary hover:bg-bg-tertiary",
                  )}
                >
                  {cat.emoji} {cat.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors">
              <ImagePlus className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors">
              <Smile className="h-4 w-4" />
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                content.trim()
                  ? "bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20"
                  : "bg-bg-tertiary text-text-muted cursor-not-allowed",
              )}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Publier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Single Post Card ───────────────────────────────────────
function PostCard({
  post,
  currentUserId,
  onLike,
  onDelete,
  onEdit,
  onToggleComments,
  isCommentsExpanded,
  comments: postComments,
  isLoadingComments,
  onSubmitComment,
  isSubmittingComment,
  onDeleteComment,
  onEditComment,
}: {
  post: Post;
  currentUserId: string | null;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
  onToggleComments: (id: string) => void;
  isCommentsExpanded: boolean;
  comments: Comment[];
  isLoadingComments: boolean;
  onSubmitComment: (postId: string, content: string) => void;
  isSubmittingComment: boolean;
  onDeleteComment: (commentId: string, postId: string) => void;
  onEditComment: (commentId: string, postId: string, content: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(post.content);
  const [commentInput, setCommentInput] = React.useState("");
  const [activeProfileUserId, setActiveProfileUserId] = React.useState<
    string | null
  >(null);
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(
    null,
  );
  const [editCommentContent, setEditCommentContent] = React.useState("");

  const displayName = post.profiles?.full_name || "Membre ScalingFlow";
  const catStyle = CATEGORY_STYLES[post.category || ""] || null;

  return (
    <div
      className={cn(
        "group rounded-2xl border bg-bg-secondary/60 backdrop-blur-sm transition-all duration-200 hover:border-border-default/80",
        post.pinned
          ? "border-accent/30 bg-accent/[0.02]"
          : "border-border-default/50",
      )}
    >
      <div className="p-5">
        {/* Pinned indicator */}
        {post.pinned && (
          <div className="flex items-center gap-1.5 mb-3 text-accent">
            <Pin className="h-3 w-3" />
            <span className="text-[11px] font-medium">Épinglé</span>
          </div>
        )}

        {/* Author row */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border-default">
            {post.profiles?.avatar_url && (
              <AvatarImage src={post.profiles.avatar_url} />
            )}
            <AvatarFallback className="bg-bg-tertiary text-text-secondary text-xs font-bold">
              {getInitials(post.profiles?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 relative">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setActiveProfileUserId(
                    activeProfileUserId === post.user_id ? null : post.user_id,
                  );
                }}
                className="text-sm font-semibold text-text-primary hover:text-accent transition-colors"
              >
                {displayName}
              </button>
              {post.profiles?.niche && (
                <span className="text-[10px] text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full">
                  {post.profiles.niche}
                </span>
              )}
              {catStyle && post.category && (
                <span
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                    catStyle.bg,
                    catStyle.text,
                    catStyle.border,
                  )}
                >
                  {CATEGORIES.find((c) => c.id === post.category)?.emoji}{" "}
                  {CATEGORIES.find((c) => c.id === post.category)?.label ||
                    post.category}
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </p>

            {/* Mini profile card */}
            {activeProfileUserId === post.user_id && (
              <MiniProfileCard
                userId={post.user_id}
                profile={post.profiles}
                onClose={() => setActiveProfileUserId(null)}
              />
            )}
          </div>

          {/* Post actions dropdown */}
          {currentUserId && currentUserId === post.user_id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-lg text-text-muted opacity-0 group-hover:opacity-100 hover:bg-bg-tertiary hover:text-text-primary transition-all">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  onClick={() => {
                    setEditing(true);
                    setEditContent(post.content);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-danger focus:text-danger"
                  onClick={() => onDelete(post.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content */}
        {editing ? (
          <div className="mb-4 ml-[52px]">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary focus:border-accent/40 focus:outline-none"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => {
                  onEdit(post.id, editContent);
                  setEditing(false);
                }}
                disabled={!editContent.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/90 transition-colors"
              >
                <Check className="h-3 w-3" />
                Enregistrer
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary text-xs font-medium hover:text-text-primary transition-colors"
              >
                <X className="h-3 w-3" />
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="ml-[52px] mb-4">
            {post.title && (
              <h3 className="font-semibold text-text-primary mb-1.5">
                {post.title}
              </h3>
            )}
            <p className="text-sm text-text-secondary/90 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1 ml-[52px] pt-3 border-t border-border-default/50">
          <button
            onClick={() => onLike(post.id)}
            disabled={!currentUserId}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
              post.liked_by_me
                ? "text-rose-400 bg-rose-500/10 hover:bg-rose-500/15"
                : "text-text-muted hover:text-rose-400 hover:bg-rose-500/10",
            )}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-transform",
                post.liked_by_me && "fill-current scale-110",
              )}
            />
            <span className="text-xs font-medium">
              {post.likes_count || ""}
            </span>
          </button>

          <button
            onClick={() => onToggleComments(post.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
              isCommentsExpanded
                ? "text-info bg-info/10"
                : "text-text-muted hover:text-info hover:bg-info/10",
            )}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs font-medium">
              {post.comments_count || ""}
            </span>
            {isCommentsExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-accent hover:bg-accent/10 transition-all">
            <Bookmark className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Comments section */}
      {isCommentsExpanded && (
        <div className="border-t border-border-default/50 bg-bg-tertiary/30 rounded-b-2xl p-4 space-y-3">
          {isLoadingComments ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
            </div>
          ) : (
            <>
              {postComments.length === 0 && (
                <p className="text-xs text-text-muted text-center py-3">
                  Sois le premier à commenter !
                </p>
              )}
              {postComments.map((comment) => {
                const cName = comment.profiles?.full_name || "Membre";
                const cAvatar = comment.profiles?.avatar_url;

                return (
                  <div key={comment.id} className="flex gap-2.5 group/comment">
                    <Avatar className="h-7 w-7 shrink-0">
                      {cAvatar && <AvatarImage src={cAvatar} />}
                      <AvatarFallback className="bg-bg-tertiary text-text-secondary text-[10px] font-bold">
                        {getInitials(comment.profiles?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-bg-secondary rounded-xl px-3 py-2 border border-border-default/30">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-text-primary">
                            {cName}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                          {currentUserId === comment.user_id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-0.5 rounded text-text-muted opacity-0 group-hover/comment:opacity-100 hover:text-text-primary transition-all ml-auto">
                                  <MoreHorizontal className="h-3 w-3" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-32">
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
                                    onDeleteComment(comment.id, post.id)
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
                            <input
                              value={editCommentContent}
                              onChange={(e) =>
                                setEditCommentContent(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  onEditComment(
                                    comment.id,
                                    post.id,
                                    editCommentContent,
                                  );
                                  setEditingCommentId(null);
                                }
                                if (e.key === "Escape") {
                                  setEditingCommentId(null);
                                }
                              }}
                              className="flex-1 h-6 rounded-md border border-border-default bg-bg-tertiary px-2 text-xs text-text-primary focus:border-accent/40 focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                onEditComment(
                                  comment.id,
                                  post.id,
                                  editCommentContent,
                                );
                                setEditingCommentId(null);
                              }}
                              className="text-accent hover:text-accent/80"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="text-text-muted hover:text-text-primary"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-text-secondary/90 leading-relaxed">
                            {comment.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Comment input */}
          {currentUserId && (
            <div className="flex gap-2 pt-1">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-accent/10 text-accent text-[10px] font-bold">
                  {getInitials(null)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <input
                  placeholder="Écrire un commentaire..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (commentInput.trim()) {
                        onSubmitComment(post.id, commentInput.trim());
                        setCommentInput("");
                      }
                    }
                  }}
                  className="flex-1 h-8 rounded-xl border border-border-default bg-bg-secondary px-3 text-xs text-text-primary placeholder:text-text-muted/60 focus:border-accent/40 focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (commentInput.trim()) {
                      onSubmitComment(post.id, commentInput.trim());
                      setCommentInput("");
                    }
                  }}
                  disabled={!commentInput.trim() || isSubmittingComment}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-xl transition-all",
                    commentInput.trim()
                      ? "bg-accent text-white hover:bg-accent/90"
                      : "bg-bg-tertiary text-text-muted",
                  )}
                >
                  {isSubmittingComment ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── Main PostFeed Component ─────────────────────────────────
// ═══════════════════════════════════════════════════════════════
export function PostFeed({ className }: { className?: string }) {
  const { user, profile } = useUser();
  const supabase = React.useMemo(() => createClient(), []);

  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeCategory, setActiveCategory] = React.useState<CategoryId>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);

  // Comments state
  const [expandedComments, setExpandedComments] = React.useState<Set<string>>(
    new Set(),
  );
  const [comments, setComments] = React.useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = React.useState<Set<string>>(
    new Set(),
  );
  const [submittingComment, setSubmittingComment] = React.useState<Set<string>>(
    new Set(),
  );

  // Likes
  const [likingPosts, setLikingPosts] = React.useState<Set<string>>(new Set());

  // ─── Fetch posts ────────────────────────────────────────────
  const fetchPosts = React.useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("community_posts")
      .select(
        "*, profiles:user_id(full_name, avatar_url, niche, experience_level, xp_points, badges, created_at)",
      )
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Impossible de charger les posts");
      setLoading(false);
      return;
    }

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
    setLoading(false);
  }, [supabase, user]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ─── Filtered posts ─────────────────────────────────────────
  const filteredPosts = React.useMemo(() => {
    let result = posts;
    if (activeCategory !== "all") {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.profiles?.full_name &&
            p.profiles.full_name.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [posts, activeCategory, searchQuery]);

  const postCountByCategory = React.useMemo(() => {
    const counts: Record<string, number> = { all: posts.length };
    posts.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [posts]);

  // ─── CRUD handlers ─────────────────────────────────────────
  const handleSubmitPost = async (content: string, category: string) => {
    if (!user) return;
    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      content,
      category,
      likes_count: 0,
      comments_count: 0,
      pinned: false,
    });
    if (error) {
      toast.error("Impossible de publier le post");
      return;
    }
    toast.success("Post publié !");
    fetch("/api/gamification/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityType: "community.post" }),
    }).catch(() => {});
    await fetchPosts();
  };

  const toggleLike = async (postId: string) => {
    if (!user || likingPosts.has(postId)) return;
    setLikingPosts((prev) => new Set(prev).add(postId));

    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const wasLiked = post.liked_by_me;

    // Optimistic update
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
          : p,
      ),
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
              : p,
          ),
        );
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
              : p,
          ),
        );
      }
    }

    setLikingPosts((prev) => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
  };

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

    if (!error) {
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

  const handleSubmitComment = async (postId: string, content: string) => {
    if (!user) return;
    setSubmittingComment((prev) => new Set(prev).add(postId));

    const { data, error } = await supabase
      .from("community_comments")
      .insert({ post_id: postId, user_id: user.id, content })
      .select("*, profiles:user_id(full_name, avatar_url)")
      .single();

    if (error) {
      toast.error("Impossible de poster le commentaire");
    } else {
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

      const post = posts.find((p) => p.id === postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p,
        ),
      );
      if (post) {
        await supabase
          .from("community_posts")
          .update({ comments_count: post.comments_count + 1 })
          .eq("id", postId);
      }
    }

    setSubmittingComment((prev) => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
  };

  const handleEditPost = async (postId: string, content: string) => {
    const { error } = await supabase
      .from("community_posts")
      .update({ content })
      .eq("id", postId);
    if (error) {
      toast.error("Impossible de modifier le post");
      return;
    }
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, content } : p)),
    );
    toast.success("Post modifié");
  };

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
    const post = posts.find((p) => p.id === postId);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments_count: Math.max(0, p.comments_count - 1) }
          : p,
      ),
    );
    if (post) {
      await supabase
        .from("community_posts")
        .update({ comments_count: Math.max(0, post.comments_count - 1) })
        .eq("id", postId);
    }
    toast.success("Commentaire supprimé");
  };

  const handleEditComment = async (
    commentId: string,
    postId: string,
    content: string,
  ) => {
    if (!content.trim()) return;
    const { error } = await supabase
      .from("community_comments")
      .update({ content: content.trim() })
      .eq("id", commentId);
    if (error) {
      toast.error("Impossible de modifier le commentaire");
      return;
    }
    setComments((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).map((c) =>
        c.id === commentId ? { ...c, content: content.trim() } : c,
      ),
    }));
    toast.success("Commentaire modifié");
  };

  // ─── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border-default/50 bg-bg-secondary/60 p-5 animate-pulse"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-bg-tertiary" />
              <div className="flex-1">
                <div className="h-3.5 w-32 rounded bg-bg-tertiary mb-1.5" />
                <div className="h-2.5 w-20 rounded bg-bg-tertiary" />
              </div>
            </div>
            <div className="ml-[52px] space-y-2">
              <div className="h-3 w-full rounded bg-bg-tertiary" />
              <div className="h-3 w-3/4 rounded bg-bg-tertiary" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex items-center gap-2 transition-all duration-300",
            searchOpen ? "flex-1" : "",
          )}
        >
          {searchOpen ? (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                autoFocus
                placeholder="Rechercher dans les posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 rounded-xl border border-border-default bg-bg-secondary pl-9 pr-8 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-accent/40 focus:outline-none"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border-default bg-bg-secondary/80 text-sm text-text-muted hover:text-text-primary hover:border-border-default transition-colors"
            >
              <Search className="h-4 w-4" />
              Rechercher
            </button>
          )}
        </div>
      </div>

      {/* Post composer */}
      {user && (
        <PostComposer
          profile={profile as PostProfile | null}
          onSubmit={handleSubmitPost}
        />
      )}

      {/* Category filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const count = postCountByCategory[cat.id] || 0;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border",
                isActive
                  ? "bg-accent text-white border-accent shadow-lg shadow-accent/20"
                  : "bg-bg-secondary/80 text-text-secondary border-border-default/50 hover:border-border-default hover:text-text-primary",
              )}
            >
              {cat.emoji && <span>{cat.emoji}</span>}
              {cat.label}
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  isActive ? "bg-white/20" : "bg-bg-tertiary",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Posts list */}
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-text-muted/30" />
          </div>
          <p className="text-sm font-medium text-text-secondary mb-1">
            {searchQuery
              ? "Aucun post ne correspond à ta recherche"
              : "Aucun post dans cette catégorie"}
          </p>
          <p className="text-xs text-text-muted">
            {searchQuery
              ? "Essaie d'autres mots-clés"
              : "Sois le premier à publier !"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id || null}
              onLike={toggleLike}
              onDelete={handleDeletePost}
              onEdit={handleEditPost}
              onToggleComments={toggleComments}
              isCommentsExpanded={expandedComments.has(post.id)}
              comments={comments[post.id] || []}
              isLoadingComments={loadingComments.has(post.id)}
              onSubmitComment={handleSubmitComment}
              isSubmittingComment={submittingComment.has(post.id)}
              onDeleteComment={handleDeleteComment}
              onEditComment={handleEditComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
