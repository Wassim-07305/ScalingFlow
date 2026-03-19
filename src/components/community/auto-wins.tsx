"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Trophy,
  Zap,
  Rocket,
  Star,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// ─── Types ──────────────────────────────────────────────────
interface WinItem {
  id: string;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  type: "badge" | "xp" | "funnel" | "revenue" | "milestone";
  title: string;
  description: string;
  emoji: string;
  timestamp: string;
  reactions: Record<string, string[]>;
}

const REACTION_EMOJIS = [
  { emoji: "\uD83D\uDC4F", label: "Bravo" },
  { emoji: "\uD83D\uDD25", label: "En feu" },
  { emoji: "\uD83D\uDCAA", label: "Force" },
  { emoji: "\uD83D\uDE80", label: "Let's go" },
];

const WIN_CONFIG: Record<
  WinItem["type"],
  {
    icon: React.ElementType;
    gradient: string;
    badge: string;
    badgeColor: "cyan" | "purple" | "default" | "yellow" | "blue";
  }
> = {
  badge: {
    icon: Trophy,
    gradient: "from-cyan-500/20 to-cyan-500/5",
    badge: "Badge",
    badgeColor: "cyan",
  },
  xp: {
    icon: Zap,
    gradient: "from-purple-500/20 to-purple-500/5",
    badge: "XP",
    badgeColor: "purple",
  },
  funnel: {
    icon: Rocket,
    gradient: "from-emerald-500/20 to-emerald-500/5",
    badge: "Funnel",
    badgeColor: "default",
  },
  revenue: {
    icon: Star,
    gradient: "from-yellow-500/20 to-yellow-500/5",
    badge: "Revenue",
    badgeColor: "yellow",
  },
  milestone: {
    icon: TrendingUp,
    gradient: "from-blue-500/20 to-blue-500/5",
    badge: "Milestone",
    badgeColor: "blue",
  },
};

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

// ─── Main Component ─────────────────────────────────────────
export function AutoWins({ className }: { className?: string }) {
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const [wins, setWins] = React.useState<WinItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [reactingTo, setReactingTo] = React.useState<string | null>(null);

  const fetchWins = React.useCallback(async () => {
    setLoading(true);

    const { data: autoPosts, error } = await supabase
      .from("community_posts")
      .select("*, profiles:user_id(full_name, avatar_url)")
      .eq("auto_generated", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      toast.error("Impossible de charger les victoires");
      setLoading(false);
      return;
    }

    const { data: recentAchievers } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, badges, xp_points, level, updated_at")
      .order("updated_at", { ascending: false })
      .limit(10);

    const winsFromPosts: WinItem[] = (
      (autoPosts ?? []) as Record<string, unknown>[]
    ).map((p) => {
      const profiles = p.profiles as {
        full_name: string | null;
        avatar_url: string | null;
      } | null;
      const content = (p.content as string) || "";
      let type: WinItem["type"] = "milestone";
      let emoji = "\uD83C\uDF89";

      if (content.includes("badge")) {
        type = "badge";
        emoji = "\uD83C\uDFC6";
      } else if (content.includes("XP") || content.includes("niveau")) {
        type = "xp";
        emoji = "\u26A1";
      } else if (content.includes("funnel") || content.includes("publié")) {
        type = "funnel";
        emoji = "\uD83D\uDE80";
      } else if (
        content.includes("revenue") ||
        content.includes("vente") ||
        content.includes("client")
      ) {
        type = "revenue";
        emoji = "\uD83D\uDCB0";
      }

      return {
        id: p.id as string,
        user_id: p.user_id as string,
        user_name: profiles?.full_name || "Membre ScalingFlow",
        avatar_url: profiles?.avatar_url || null,
        type,
        title: (p.title as string) || "Nouvelle victoire !",
        description: content,
        emoji,
        timestamp: p.created_at as string,
        reactions: (p.reactions as Record<string, string[]>) || {},
      };
    });

    const syntheticWins: WinItem[] = [];
    for (const achiever of recentAchievers ?? []) {
      const badges = (achiever.badges as string[]) || [];
      if (badges.length > 0) {
        const latestBadge = badges[badges.length - 1];
        const alreadyExists = winsFromPosts.some(
          (w) =>
            w.user_id === achiever.id && w.description.includes(latestBadge),
        );
        if (!alreadyExists) {
          syntheticWins.push({
            id: `badge-${achiever.id}-${latestBadge}`,
            user_id: achiever.id,
            user_name: achiever.full_name || "Membre ScalingFlow",
            avatar_url: achiever.avatar_url,
            type: "badge",
            title: "Badge débloqué !",
            description: `A obtenu le badge "${latestBadge}"`,
            emoji: "\uD83C\uDFC6",
            timestamp: achiever.updated_at,
            reactions: {},
          });
        }
      }

      const xp = achiever.xp_points || 0;
      if (xp > 0 && xp % 500 < 100) {
        const milestone = Math.floor(xp / 500) * 500;
        const alreadyExists = winsFromPosts.some(
          (w) =>
            w.user_id === achiever.id &&
            w.description.includes(`${milestone} XP`),
        );
        if (!alreadyExists && milestone > 0) {
          syntheticWins.push({
            id: `xp-${achiever.id}-${milestone}`,
            user_id: achiever.id,
            user_name: achiever.full_name || "Membre ScalingFlow",
            avatar_url: achiever.avatar_url,
            type: "xp",
            title: "Palier XP atteint !",
            description: `A franchi le cap des ${milestone} XP (Niveau ${achiever.level || 1})`,
            emoji: "\u26A1",
            timestamp: achiever.updated_at,
            reactions: {},
          });
        }
      }
    }

    const allWins = [...winsFromPosts, ...syntheticWins].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    setWins(allWins);
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    fetchWins();
  }, [fetchWins]);

  const handleReaction = async (winId: string, emoji: string) => {
    if (!user) return;

    // Only persist reactions for real posts (not synthetic wins)
    const isSyntheticWin =
      winId.startsWith("badge-") || winId.startsWith("xp-");

    setReactingTo(winId);

    // Optimistic local update
    let updatedReactions: Record<string, string[]> = {};
    setWins((prev) =>
      prev.map((w) => {
        if (w.id !== winId) return w;
        const reactions = { ...w.reactions };
        const users = reactions[emoji] || [];
        if (users.includes(user.id)) {
          reactions[emoji] = users.filter((uid) => uid !== user.id);
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji] = [...users, user.id];
        }
        updatedReactions = reactions;
        return { ...w, reactions };
      }),
    );

    // Persist to Supabase for real posts
    if (!isSyntheticWin) {
      const { error } = await supabase
        .from("community_posts")
        .update({ reactions: updatedReactions })
        .eq("id", winId);

      if (error) {
        toast.error("Impossible de sauvegarder la réaction");
        // Revert on error
        fetchWins();
      }
    }

    setTimeout(() => setReactingTo(null), 300);
  };

  // ─── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border-default/50 bg-bg-secondary/60 p-5 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-bg-tertiary" />
              <div className="flex-1">
                <div className="h-3.5 w-40 rounded bg-bg-tertiary mb-1.5" />
                <div className="h-3 w-56 rounded bg-bg-tertiary" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── Empty state ────────────────────────────────────────────
  if (wins.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-16 text-center",
          className,
        )}
      >
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-accent/10 to-cyan-500/10 flex items-center justify-center mb-4">
          <Trophy className="h-10 w-10 text-text-muted/30" />
        </div>
        <p className="text-sm font-medium text-text-secondary mb-1">
          Aucune victoire pour le moment
        </p>
        <p className="text-xs text-text-muted max-w-xs">
          Les victoires apparaissent automatiquement quand des membres
          atteignent des paliers, débloquent des badges ou publient des funnels.
        </p>
      </div>
    );
  }

  // ─── Wins list ──────────────────────────────────────────────
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent/10 to-cyan-500/10">
          <Sparkles className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            Victoires automatiques
          </h2>
          <p className="text-xs text-text-muted">
            Les accomplissements des membres sont célébrés ici
          </p>
        </div>
      </div>

      {wins.slice(0, 15).map((win, idx) => {
        const config = WIN_CONFIG[win.type];
        const IconComponent = config.icon;

        return (
          <div
            key={win.id}
            className="group rounded-2xl border border-border-default/50 bg-bg-secondary/60 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-accent/20 hover:shadow-lg hover:shadow-accent/5 animate-in fade-in slide-in-from-bottom-3"
            style={{
              animationDelay: `${idx * 60}ms`,
              animationFillMode: "both",
            }}
          >
            {/* Gradient accent bar */}
            <div className={cn("h-0.5 bg-gradient-to-r", config.gradient)} />

            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Win emoji card */}
                <div
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl",
                    config.gradient,
                  )}
                >
                  {win.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  {/* User + type */}
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 ring-1 ring-border-default">
                        {win.avatar_url && <AvatarImage src={win.avatar_url} />}
                        <AvatarFallback className="bg-bg-tertiary text-text-secondary text-[10px] font-bold">
                          {getInitials(win.user_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold text-text-primary">
                        {win.user_name}
                      </span>
                    </div>
                    <Badge
                      variant={config.badgeColor}
                      className="text-[10px] gap-1"
                    >
                      <IconComponent className="h-3 w-3" />
                      {config.badge}
                    </Badge>
                    <span className="text-[10px] text-text-muted ml-auto">
                      {formatDistanceToNow(new Date(win.timestamp), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>

                  {/* Win content */}
                  <p className="text-sm font-semibold text-accent mb-0.5">
                    {win.title}
                  </p>
                  <p className="text-xs text-text-secondary/80 leading-relaxed">
                    {win.description}
                  </p>

                  {/* Reactions */}
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    {REACTION_EMOJIS.map(({ emoji, label }) => {
                      const reactionUsers = win.reactions[emoji] || [];
                      const hasReacted = user
                        ? reactionUsers.includes(user.id)
                        : false;
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(win.id, emoji)}
                          disabled={!user || reactingTo === win.id}
                          title={label}
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-all duration-200",
                            hasReacted
                              ? "bg-accent/15 border-accent/30 shadow-sm scale-105"
                              : "bg-bg-tertiary/80 border-transparent hover:border-border-default hover:bg-bg-tertiary hover:scale-105",
                            "disabled:opacity-50 active:scale-95",
                          )}
                        >
                          <span
                            className={cn(
                              "text-sm transition-transform duration-200",
                              hasReacted && "animate-in zoom-in duration-300",
                            )}
                          >
                            {emoji}
                          </span>
                          {reactionUsers.length > 0 && (
                            <span
                              className={cn(
                                "text-[10px] font-bold",
                                hasReacted
                                  ? "text-accent"
                                  : "text-text-secondary",
                              )}
                            >
                              {reactionUsers.length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
