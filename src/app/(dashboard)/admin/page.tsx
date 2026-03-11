"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Users,
  TrendingUp,
  Sparkles,
  Activity,
  Loader2,
  CreditCard,
  ShieldAlert,
  UserCheck,
  Crown,
  Zap,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalGenerations: number;
  totalXP: number;
  proUsers: number;
  premiumUsers: number;
  freeUsers: number;
  onboardingCompleted: number;
  generationsThisMonth: number;
  newUsersThisMonth: number;
}

interface RecentUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  xp_points: number;
  level: number;
  subscription_plan: string;
  onboarding_completed: boolean;
}

interface RecentActivity {
  id: string;
  user_id: string;
  activity_type: string;
  created_at: string;
  user_name: string | null;
}

export default function AdminPage() {
  const { user, profile, loading: userLoading } = useUser();
  const router = useRouter();
  const supabase = createClient();

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalGenerations: 0,
    totalXP: 0,
    proUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    onboardingCompleted: 0,
    generationsThisMonth: 0,
    newUsersThisMonth: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Role protection ─────────────────────────────────────────
  useEffect(() => {
    if (!userLoading && (!profile || profile.role !== "admin")) {
      router.replace("/");
    }
  }, [userLoading, profile, router]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // ─── Tous les profils (pour stats agrégées) ─────────────
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, subscription_plan, subscription_status, xp_points, onboarding_completed, created_at");

      const totalUsers = allProfiles?.length || 0;
      const proUsers = allProfiles?.filter((p) => p.subscription_plan === "pro" && p.subscription_status === "active").length || 0;
      const premiumUsers = allProfiles?.filter((p) => p.subscription_plan === "premium" && p.subscription_status === "active").length || 0;
      const freeUsers = totalUsers - proUsers - premiumUsers;
      const onboardingCompleted = allProfiles?.filter((p) => p.onboarding_completed).length || 0;
      const totalXP = allProfiles?.reduce((sum, p) => sum + (p.xp_points || 0), 0) || 0;
      const newUsersThisMonth = allProfiles?.filter((p) => new Date(p.created_at) >= startOfMonth).length || 0;

      // ─── Utilisateurs actifs (7 derniers jours) ─────────────
      const { data: activeData } = await supabase
        .from("activity_log")
        .select("user_id")
        .gte("created_at", sevenDaysAgo.toISOString());

      const uniqueActiveUsers = activeData
        ? new Set(activeData.map((row) => row.user_id)).size
        : 0;

      // ─── Total generations (toutes tables) ──────────────────
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

      // ─── Generations ce mois-ci (via activity_log) ──────────
      const { count: generationsThisMonth } = await supabase
        .from("activity_log")
        .select("*", { count: "exact", head: true })
        .like("activity_type", "generation.%")
        .gte("created_at", startOfMonth.toISOString());

      setStats({
        totalUsers,
        activeUsers: uniqueActiveUsers,
        totalGenerations,
        totalXP,
        proUsers,
        premiumUsers,
        freeUsers,
        onboardingCompleted,
        generationsThisMonth: generationsThisMonth || 0,
        newUsersThisMonth,
      });

      // ─── Utilisateurs recents ───────────────────────────────
      const { data: recent } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, created_at, xp_points, level, subscription_plan, onboarding_completed")
        .order("created_at", { ascending: false })
        .limit(10);

      if (recent) setRecentUsers(recent);

      // ─── Activite recente ───────────────────────────────────
      const { data: activityData } = await supabase
        .from("activity_log")
        .select("id, user_id, activity_type, created_at")
        .order("created_at", { ascending: false })
        .limit(15);

      if (activityData) {
        const userIds = [...new Set(activityData.map((a) => a.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const nameMap = new Map(profilesData?.map((p) => [p.id, p.full_name]) || []);

        setRecentActivity(
          activityData.map((a) => ({
            ...a,
            user_name: nameMap.get(a.user_id) || null,
          }))
        );
      }
    } catch {
      // Stats loading failed silently
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (profile?.role === "admin") fetchStats();
  }, [profile, fetchStats]);

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

  const formatActivityType = (type: string) => {
    const labels: Record<string, string> = {
      "generation.offer": "Generation offre",
      "generation.market": "Analyse marche",
      "generation.funnel": "Generation funnel",
      "generation.ads": "Generation ads",
      "generation.content": "Generation contenu",
      "generation.assets": "Generation assets",
      "generation.brand": "Generation marque",
      "generation.roadmap": "Generation roadmap",
      "generation.chat": "Chat IA",
      "generation.vault": "Analyse vault",
      "generation.persona": "Generation persona",
      "generation.instagram": "Optimisation Instagram",
      "generation.competitors": "Analyse concurrents",
      "generation.score": "Score offre",
    };
    return labels[type] || type.replace("generation.", "Generation ").replace(".", " ");
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "pro":
        return <Badge variant="cyan">Pro</Badge>;
      case "premium":
        return <Badge className="bg-[rgba(139,92,246,0.15)] text-[#A78BFA] border-[rgba(139,92,246,0.3)]">Premium</Badge>;
      default:
        return <Badge variant="muted">Free</Badge>;
    }
  };

  const [recalculating, setRecalculating] = useState(false);

  const handleRecalculateLeaderboard = async () => {
    setRecalculating(true);
    try {
      const res = await fetch("/api/gamification/recalculate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur de recalcul");
      } else {
        toast.success(data.message || "Leaderboard recalcule");
      }
    } catch {
      toast.error("Erreur lors du recalcul du leaderboard");
    } finally {
      setRecalculating(false);
    }
  };

  // ─── Guard: loading or not admin ────────────────────────────
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </div>
    );
  }

  if (!profile || profile.role !== "admin") {
    return null;
  }

  const conversionRate = stats.totalUsers > 0
    ? Math.round(((stats.proUsers + stats.premiumUsers) / stats.totalUsers) * 100)
    : 0;

  const onboardingRate = stats.totalUsers > 0
    ? Math.round((stats.onboardingCompleted / stats.totalUsers) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title="Administration"
        description="Vue d'ensemble de la plateforme ScalingFlow."
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRecalculateLeaderboard}
          disabled={recalculating}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${recalculating ? "animate-spin" : ""}`} />
          {recalculating ? "Recalcul..." : "Recalculer leaderboard"}
        </Button>
      </PageHeader>

      {/* ─── KPIs principaux ─────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          {
            label: "Utilisateurs",
            value: stats.totalUsers,
            icon: Users,
            color: "text-info",
            sub: `+${stats.newUsersThisMonth} ce mois`,
          },
          {
            label: "Actifs (7j)",
            value: stats.activeUsers,
            icon: Activity,
            color: "text-accent",
            sub: stats.totalUsers > 0
              ? `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% du total`
              : "—",
          },
          {
            label: "Generations IA",
            value: stats.totalGenerations,
            icon: Sparkles,
            color: "text-accent",
            sub: `${stats.generationsThisMonth} ce mois`,
          },
          {
            label: "XP total distribue",
            value: stats.totalXP,
            icon: TrendingUp,
            color: "text-accent",
            sub: stats.totalUsers > 0
              ? `~${Math.round(stats.totalXP / stats.totalUsers)} XP/user`
              : "—",
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
                  {!loading && (
                    <p className="text-xs text-text-muted mt-1">{kpi.sub}</p>
                  )}
                </div>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Abonnements & Conversion ────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">Abonnes Pro</p>
                <p className="text-2xl font-bold text-text-primary">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin text-text-muted" /> : <AnimatedCounter value={stats.proUsers} />}
                </p>
              </div>
              <Zap className="h-5 w-5 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">Abonnes Premium</p>
                <p className="text-2xl font-bold text-text-primary">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin text-text-muted" /> : <AnimatedCounter value={stats.premiumUsers} />}
                </p>
              </div>
              <Crown className="h-5 w-5 text-[#A78BFA]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">Taux conversion</p>
                <p className="text-2xl font-bold text-text-primary">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin text-text-muted" /> : `${conversionRate}%`}
                </p>
                {!loading && (
                  <p className="text-xs text-text-muted mt-1">Free → Payant</p>
                )}
              </div>
              <CreditCard className="h-5 w-5 text-info" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">Onboarding complete</p>
                <p className="text-2xl font-bold text-text-primary">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin text-text-muted" /> : `${onboardingRate}%`}
                </p>
                {!loading && (
                  <p className="text-xs text-text-muted mt-1">{stats.onboardingCompleted}/{stats.totalUsers} users</p>
                )}
              </div>
              <UserCheck className="h-5 w-5 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Repartition abonnements ─────────────────────────── */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Repartition des abonnements</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Free", count: stats.freeUsers, color: "bg-text-muted", total: stats.totalUsers },
                { label: "Pro", count: stats.proUsers, color: "bg-accent", total: stats.totalUsers },
                { label: "Premium", count: stats.premiumUsers, color: "bg-[#A78BFA]", total: stats.totalUsers },
              ].map((plan) => {
                const pct = stats.totalUsers > 0 ? Math.round((plan.count / plan.total) * 100) : 0;
                return (
                  <div key={plan.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">{plan.label}</span>
                      <span className="text-text-primary font-medium">{plan.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                      <div
                        className={`h-full rounded-full ${plan.color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Two columns: Users + Activity ───────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Utilisateurs recents */}
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
                    className="flex items-center gap-3 p-3 rounded-xl bg-bg-tertiary"
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
                        Niv. {recentUser.level} &middot; {recentUser.xp_points} XP
                        {!recentUser.onboarding_completed && (
                          <span className="text-warning"> &middot; Onboarding en cours</span>
                        )}
                      </p>
                    </div>
                    {getPlanBadge(recentUser.subscription_plan)}
                    <span className="text-xs text-text-muted whitespace-nowrap hidden sm:block">
                      {formatDate(recentUser.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activite recente */}
        <Card>
          <CardHeader>
            <CardTitle>Activite recente</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">
                Aucune activite pour le moment.
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-bg-tertiary"
                  >
                    <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {formatActivityType(activity.activity_type)}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {activity.user_name || "Utilisateur"}
                      </p>
                    </div>
                    <span className="text-xs text-text-muted whitespace-nowrap">
                      {formatDate(activity.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
