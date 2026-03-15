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
  ExternalLink,
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

export function InstagramStats() {
  const [data, setData] = React.useState<InstagramStatsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchStats = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/instagram/stats");
      const json = await res.json();
      setData(json);
    } catch {
      setData({ connected: false, error: "Erreur de connexion" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Loading skeleton
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-bg-tertiary" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 rounded bg-bg-tertiary" />
                <div className="h-3 w-24 rounded bg-bg-tertiary" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-bg-tertiary" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square rounded-lg bg-bg-tertiary" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not connected
  if (!data?.connected) {
    return (
      <Card className="border-border-default">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 mx-auto mb-4">
              <Instagram className="h-7 w-7 text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              Connecte ton compte Instagram
            </h3>
            <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">
              {data?.error || "Connecte ton compte Instagram dans les paramètres pour afficher tes statistiques ici."}
            </p>
            <Button variant="outline" asChild>
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

  return (
    <div className="space-y-4">
      {/* Profile + Stats */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Instagram className="h-4 w-4 text-pink-400" />
              Instagram — @{profile.username}
            </CardTitle>
            <button
              onClick={fetchStats}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-bg-tertiary p-3 text-center">
              <Users className="h-4 w-4 text-accent mx-auto mb-1" />
              <p className="text-lg font-bold text-text-primary">
                {formatNumber(profile.followers_count)}
              </p>
              <p className="text-xs text-text-muted">Abonnés</p>
            </div>
            <div className="rounded-xl bg-bg-tertiary p-3 text-center">
              <ImageIcon className="h-4 w-4 text-accent mx-auto mb-1" />
              <p className="text-lg font-bold text-text-primary">
                {formatNumber(profile.media_count)}
              </p>
              <p className="text-xs text-text-muted">Posts</p>
            </div>
            <div className="rounded-xl bg-bg-tertiary p-3 text-center">
              <TrendingUp className="h-4 w-4 text-accent mx-auto mb-1" />
              <p className="text-lg font-bold text-text-primary">
                {engagementRate}%
              </p>
              <p className="text-xs text-text-muted">Engagement</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Post */}
      {topPost && (
        <Card className="border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              Meilleur post récent
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-3">
              {(topPost.thumbnail_url || topPost.media_url) && (
                <a
                  href={topPost.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={topPost.thumbnail_url || topPost.media_url || ""}
                    alt="Top post"
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                </a>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-secondary line-clamp-2">
                  {topPost.caption || "Sans légende"}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Heart className="h-3 w-3 text-pink-400" />
                    {formatNumber(topPost.like_count)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <MessageCircle className="h-3 w-3 text-blue-400" />
                    {formatNumber(topPost.comments_count)}
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
          <CardHeader className="pb-2">
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
                  className="group relative aspect-square rounded-lg overflow-hidden bg-bg-tertiary"
                >
                  {(post.thumbnail_url || post.media_url) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={post.thumbnail_url || post.media_url || ""}
                      alt={post.caption?.slice(0, 50) || "Post"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-text-muted" />
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-white">
                      <Heart className="h-3 w-3" />
                      {formatNumber(post.like_count)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-white">
                      <MessageCircle className="h-3 w-3" />
                      {formatNumber(post.comments_count)}
                    </span>
                  </div>

                  {/* Media type badge */}
                  {post.media_type === "VIDEO" && (
                    <Badge
                      variant="muted"
                      className="absolute top-1 right-1 text-[9px] px-1.5 py-0"
                    >
                      Vidéo
                    </Badge>
                  )}
                  {post.media_type === "CAROUSEL_ALBUM" && (
                    <Badge
                      variant="muted"
                      className="absolute top-1 right-1 text-[9px] px-1.5 py-0"
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
