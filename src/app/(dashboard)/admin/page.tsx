"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { Users, TrendingUp, Sparkles, Activity, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalGenerations: number;
  totalXP: number;
}

interface RecentUser {
  id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  xp_points: number;
  level: number;
}

export default function AdminPage() {
  const { user } = useUser();
  const supabase = createClient();

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalGenerations: 0,
    totalXP: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      // --- Total utilisateurs ---
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // --- Utilisateurs actifs (7 derniers jours) ---
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: activeData } = await supabase
        .from("activity_log")
        .select("user_id")
        .gte("created_at", sevenDaysAgo.toISOString());

      const uniqueActiveUsers = activeData
        ? new Set(activeData.map((row) => row.user_id)).size
        : 0;

      // --- Total generations (somme des contenus generes) ---
      const [
        { count: offersCount },
        { count: assetsCount },
        { count: adsCount },
        { count: funnelsCount },
        { count: contentCount },
      ] = await Promise.all([
        supabase.from("offers").select("*", { count: "exact", head: true }),
        supabase.from("sales_assets").select("*", { count: "exact", head: true }),
        supabase.from("ad_creatives").select("*", { count: "exact", head: true }),
        supabase.from("funnels").select("*", { count: "exact", head: true }),
        supabase.from("content_pieces").select("*", { count: "exact", head: true }),
      ]);

      const totalGenerations =
        (offersCount || 0) +
        (assetsCount || 0) +
        (adsCount || 0) +
        (funnelsCount || 0) +
        (contentCount || 0);

      // --- Total XP distribue ---
      const { data: xpData } = await supabase
        .from("profiles")
        .select("xp_points");

      const totalXP = xpData
        ? xpData.reduce((sum, row) => sum + (row.xp_points || 0), 0)
        : 0;

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: uniqueActiveUsers,
        totalGenerations,
        totalXP,
      });

      // --- Utilisateurs recents ---
      const { data: recent } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, created_at, xp_points, level")
        .order("created_at", { ascending: false })
        .limit(10);

      if (recent) {
        setRecentUsers(
          recent.map((u) => ({
            ...u,
            display_name: null,
          }))
        );
      }
    } catch (error) {
      console.error("Erreur chargement stats admin:", error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div>
      <PageHeader
        title="Admin"
        description="Panel d'administration ScalingFlow."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          {
            label: "Utilisateurs",
            value: stats.totalUsers,
            icon: Users,
            color: "text-info",
          },
          {
            label: "Actifs (7j)",
            value: stats.activeUsers,
            icon: Activity,
            color: "text-accent",
          },
          {
            label: "Generations",
            value: stats.totalGenerations,
            icon: Sparkles,
            color: "text-accent",
          },
          {
            label: "XP total",
            value: stats.totalXP,
            icon: TrendingUp,
            color: "text-accent",
          },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted">{kpi.label}</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                    ) : (
                      <AnimatedCounter value={kpi.value} />
                    )}
                  </p>
                </div>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent users */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs recents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
            </div>
          ) : recentUsers.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">
              Aucun utilisateur pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((recentUser) => (
                <div
                  key={recentUser.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-bg-tertiary"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-bg-secondary text-text-secondary text-xs">
                      {getInitials(recentUser.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {recentUser.full_name || "Utilisateur"}
                    </p>
                    <p className="text-xs text-text-muted">
                      Niveau {recentUser.level} &middot; {recentUser.xp_points} XP
                    </p>
                  </div>
                  <Badge
                    variant={recentUser.xp_points > 0 ? "cyan" : "muted"}
                  >
                    {recentUser.xp_points > 0 ? "Actif" : "Nouveau"}
                  </Badge>
                  <span className="text-xs text-text-muted whitespace-nowrap">
                    {formatDate(recentUser.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
