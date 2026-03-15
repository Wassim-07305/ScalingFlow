"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Zap, Rocket, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// ─── Types ───────────────────────────────────────────────────
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
  reactions: Record<string, string[]>; // emoji -> user_ids
}

const REACTION_EMOJIS = [
  { emoji: "\uD83D\uDC4F", label: "Bravo" },
  { emoji: "\uD83D\uDD25", label: "En feu" },
  { emoji: "\uD83D\uDCAA", label: "Force" },
  { emoji: "\uD83D\uDE80", label: "Lancement" },
];

const WIN_ICONS: Record<WinItem["type"], React.ElementType> = {
  badge: Trophy,
  xp: Zap,
  funnel: Rocket,
  revenue: Star,
  milestone: Star,
};

interface AutoWinsProps {
  className?: string;
}

export function AutoWins({ className }: AutoWinsProps) {
  const { user } = useUser();
  const supabase = createClient();

  const [wins, setWins] = React.useState<WinItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [reactingTo, setReactingTo] = React.useState<string | null>(null);

  // ─── Fetch auto-generated wins ───────────────────────────────
  const fetchWins = React.useCallback(async () => {
    setLoading(true);

    // Fetch auto-generated community posts (wins category)
    const { data: autoPosts, error } = await supabase
      .from("community_posts")
      .select("*, profiles:user_id(full_name, avatar_url)")
      .eq("auto_generated", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      toast.error("Impossible de charger les victoires automatiques");
      setLoading(false);
      return;
    }

    // Also fetch recent badge/XP achievements from profiles that changed recently
    const { data: recentAchievers } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, badges, xp_points, level, updated_at")
      .order("updated_at", { ascending: false })
      .limit(10);

    const winsFromPosts: WinItem[] = ((autoPosts ?? []) as Record<string, unknown>[]).map((p) => {
      const profiles = p.profiles as { full_name: string | null; avatar_url: string | null } | null;
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
      } else if (content.includes("revenue") || content.includes("vente") || content.includes("client")) {
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
        reactions: {},
      };
    });

    // Generate synthetic wins from recent achievers (badges earned)
    const syntheticWins: WinItem[] = [];
    for (const achiever of recentAchievers ?? []) {
      const badges = (achiever.badges as string[]) || [];
      if (badges.length > 0) {
        const latestBadge = badges[badges.length - 1];
        // Only show if not already in posts
        const alreadyExists = winsFromPosts.some(
          (w) => w.user_id === achiever.id && w.description.includes(latestBadge)
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

      // XP milestone (every 500 XP)
      const xp = achiever.xp_points || 0;
      if (xp > 0 && xp % 500 < 100) {
        const milestone = Math.floor(xp / 500) * 500;
        const alreadyExists = winsFromPosts.some(
          (w) => w.user_id === achiever.id && w.description.includes(`${milestone} XP`)
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
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setWins(allWins);
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    fetchWins();
  }, [fetchWins]);

  // ─── Handle reactions ────────────────────────────────────────
  const handleReaction = (winId: string, emoji: string) => {
    if (!user) return;
    setReactingTo(winId);

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
        return { ...w, reactions };
      })
    );

    setTimeout(() => setReactingTo(null), 300);
  };

  // ─── Helpers ─────────────────────────────────────────────────
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const typeBadgeVariant: Record<WinItem["type"], "default" | "cyan" | "purple" | "yellow" | "blue"> = {
    badge: "cyan",
    xp: "purple",
    funnel: "default",
    revenue: "yellow",
    milestone: "blue",
  };

  const typeLabel: Record<WinItem["type"], string> = {
    badge: "Badge",
    xp: "XP",
    funnel: "Funnel",
    revenue: "Revenue",
    milestone: "Milestone",
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    );
  }

  if (wins.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <Trophy className="h-8 w-8 text-text-muted/40 mx-auto mb-2" />
        <p className="text-sm text-text-muted">
          Aucune victoire automatique pour le moment.
        </p>
        <p className="text-xs text-text-muted/60 mt-1">
          Les victoires apparaissent quand des membres atteignent des paliers.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {wins.slice(0, 10).map((win) => {
        const IconComponent = WIN_ICONS[win.type];
        return (
          <Card
            key={win.id}
            className="overflow-hidden border-border-default/50 hover:border-accent/30 transition-colors"
          >
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start gap-3">
                {/* Emoji celebration */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-lg">
                  {win.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  {/* User + badge */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        {win.avatar_url && <AvatarImage src={win.avatar_url} />}
                        <AvatarFallback className="bg-bg-tertiary text-text-secondary text-[10px]">
                          {getInitials(win.user_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-text-primary truncate">
                        {win.user_name}
                      </span>
                    </div>
                    <Badge variant={typeBadgeVariant[win.type]} className="text-[10px]">
                      <IconComponent className="h-3 w-3 mr-1" />
                      {typeLabel[win.type]}
                    </Badge>
                  </div>

                  {/* Win content */}
                  <p className="text-sm font-medium text-accent mb-0.5">
                    {win.title}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {win.description}
                  </p>

                  {/* Timestamp */}
                  <span className="text-[10px] text-text-muted mt-1 block">
                    {formatDistanceToNow(new Date(win.timestamp), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>

                  {/* Reactions */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {REACTION_EMOJIS.map(({ emoji, label }) => {
                      const reactionUsers = win.reactions[emoji] || [];
                      const hasReacted = user ? reactionUsers.includes(user.id) : false;
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(win.id, emoji)}
                          disabled={!user || reactingTo === win.id}
                          title={label}
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all",
                            hasReacted
                              ? "bg-accent/20 border border-accent/40"
                              : "bg-bg-tertiary border border-transparent hover:border-border-default",
                            "disabled:opacity-50"
                          )}
                        >
                          <span>{emoji}</span>
                          {reactionUsers.length > 0 && (
                            <span className="text-text-secondary text-[10px]">
                              {reactionUsers.length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
