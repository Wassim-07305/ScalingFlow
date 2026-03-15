"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import {
  Instagram,
  Users,
  Image as ImageIcon,
  TrendingUp,
  Heart,
  MessageCircle,
  RefreshCw,
  Star,
  Link2,
} from "lucide-react";

interface InstagramProfile {
  username: string;
  name: string;
  followers_count: number;
  media_count: number;
  profile_picture_url: string | null;
}

interface InstagramPost {
  id: string;
  caption: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  media_type: string;
  thumbnail_url: string | null;
  media_url: string | null;
  permalink: string;
}

interface InstagramStatsData {
  connected: boolean;
  profile?: InstagramProfile;
  recentPosts?: InstagramPost[];
  engagementRate?: number;
  topPost?: InstagramPost | null;
  error?: string;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin === 1) return "il y a 1 min";
  return `il y a ${diffMin} min`;
}

export function InstagramStats() {
  const [data, setData] = React.useState<InstagramStatsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [isPolling, setIsPolling] = React.useState(true);
  const [, forceUpdate] = React.useState(0);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = React.useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch("/api/integrations/instagram/stats");
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch {
      setData({ connected: false, error: "Erreur de connexion" });
    } finally {
      setLoading(false);
    }
  }, []);

  // Démarrer / arrêter le polling selon la visibilité de l'onglet
  React.useEffect(() => {
    fetchStats();

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        fetchStats(false);
      }, POLL_INTERVAL_MS);
      setIsPolling(true);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPolling(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchStats(false);
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchStats]);

  // Mettre à jour le texte "il y a X min" toutes les 30 secondes
  React.useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate((n) => n + 1);
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-5 animate-pulse">
              {/* Profile header skeleton */}
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-bg-tertiary" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-36 rounded-md bg-bg-tertiary" />
                  <div className="h-3 w-24 rounded-md bg-bg-tertiary" />
                </div>
              </div>
              {/* Stats skeleton */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-xl bg-bg-tertiary"
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Posts grid skeleton */}
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse">
              <div className="h-4 w-28 rounded-md bg-bg-tertiary mb-4" />
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl bg-bg-tertiary"
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── Not connected ── */
  if (!data?.connected) {
    return (
      <Card className="border-border-default overflow-hidden">
        <CardContent className="pt-0 p-0">
          {/* Instagram gradient top bar */}
          <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600" />

          <div className="text-center py-12 px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400/15 via-pink-500/15 to-purple-600/15 border border-pink-500/20 mx-auto mb-5">
              <Instagram className="h-8 w-8 text-pink-400" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">
              Connecte ton compte Instagram
            </h3>
            <p className="text-sm text-text-secondary max-w-sm mx-auto mb-8 leading-relaxed">
              {data?.error ||
                "Connecte ton compte Instagram dans les paramètres pour afficher tes statistiques ici."}
            </p>
            <Button variant="outline" asChild className="rounded-xl">
              <a href="/settings">
                <Link2 className="h-4 w-4 mr-2" />
                Aller dans les paramètres
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { profile, recentPosts = [], engagementRate = 0, topPost } = data;
  if (!profile) return null;

  const statCards = [
    {
      icon: Users,
      value: formatNumber(profile.followers_count),
      label: "Abonnés",
      gradient: "from-emerald-400/10 to-emerald-400/5",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-400/10",
    },
    {
      icon: ImageIcon,
      value: formatNumber(profile.media_count),
      label: "Posts",
      gradient: "from-blue-400/10 to-blue-400/5",
      iconColor: "text-blue-400",
      borderColor: "border-blue-400/10",
    },
    {
      icon: TrendingUp,
      value: `${engagementRate}%`,
      label: "Engagement",
      gradient: "from-purple-400/10 to-purple-400/5",
      iconColor: "text-purple-400",
      borderColor: "border-purple-400/10",
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile + Stats */}
      <Card className="border-border-default/50 bg-bg-secondary/30 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5 text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400/15 via-pink-500/15 to-purple-600/15">
                <Instagram className="h-4 w-4 text-pink-400" />
              </div>
              @{profile.username}
              {isPolling && (
                <span
                  className="relative flex h-2 w-2"
                  title="Rafraîchissement automatique actif"
                >
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-[11px] text-text-muted">
                  {formatRelativeTime(lastUpdated)}
                </span>
              )}
              <button
                onClick={() => fetchStats(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all"
                title="Rafraîchir maintenant"
                aria-label="Rafraîchir les statistiques Instagram"
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", loading && "animate-spin")}
                />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-3">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={cn(
                    "rounded-xl bg-gradient-to-br p-4 text-center border transition-all duration-300 hover:scale-[1.03] hover:shadow-lg",
                    stat.gradient,
                    stat.borderColor
                  )}
                >
                  <Icon
                    className={cn("h-4 w-4 mx-auto mb-1.5", stat.iconColor)}
                  />
                  <p className="text-xl font-bold text-text-primary">
                    {stat.value}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Post */}
      {topPost && (
        <Card className="border-accent/20 bg-gradient-to-r from-accent/5 via-bg-secondary to-bg-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              Meilleur post récent
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-4">
              {(topPost.thumbnail_url || topPost.media_url) && (
                <a
                  href={topPost.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={topPost.thumbnail_url || topPost.media_url || ""}
                    alt="Top post"
                    className="h-24 w-24 rounded-xl object-cover ring-1 ring-border-default/30 group-hover:ring-accent/30 transition-all"
                  />
                </a>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">
                  {topPost.caption || "Sans légende"}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Heart className="h-3.5 w-3.5 text-pink-400" />
                    <span className="font-medium text-text-secondary">
                      {formatNumber(topPost.like_count)}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-text-muted">
                    <MessageCircle className="h-3.5 w-3.5 text-blue-400" />
                    <span className="font-medium text-text-secondary">
                      {formatNumber(topPost.comments_count)}
                    </span>
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatDate(topPost.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Posts Grid */}
      {recentPosts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Posts récents</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {recentPosts.map((post) => (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-xl overflow-hidden bg-bg-tertiary ring-1 ring-border-default/20"
                >
                  {post.thumbnail_url || post.media_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={post.thumbnail_url || post.media_url || ""}
                      alt={post.caption?.slice(0, 50) || "Post"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-text-muted" />
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-white font-medium">
                      <Heart className="h-3.5 w-3.5" />
                      {formatNumber(post.like_count)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-white font-medium">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {formatNumber(post.comments_count)}
                    </span>
                  </div>

                  {/* Media type badge */}
                  {post.media_type === "VIDEO" && (
                    <Badge
                      variant="muted"
                      className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 bg-black/50 backdrop-blur-sm border-none"
                    >
                      Vidéo
                    </Badge>
                  )}
                  {post.media_type === "CAROUSEL_ALBUM" && (
                    <Badge
                      variant="muted"
                      className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 bg-black/50 backdrop-blur-sm border-none"
                    >
                      Carrousel
                    </Badge>
                  )}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
