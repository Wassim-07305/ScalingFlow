import { SupabaseClient } from "@supabase/supabase-js";

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: "ads" | "activity" | "sales" | "content";
  check: (
    supabase: SupabaseClient,
    userId: string,
  ) => Promise<AlertResult | null>;
}

export interface AlertResult {
  ruleId: string;
  severity: "warning" | "danger" | "info";
  title: string;
  message: string;
  link?: string;
}

// ─── Helpers ─────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(
    Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24),
  );
}

// ─── Alert Rules ─────────────────────────────────────────────

export const ALERT_RULES: AlertRule[] = [
  // ══════════════════════════════════════════════════════════════
  // ADS
  // ══════════════════════════════════════════════════════════════
  {
    id: "roas_low",
    name: "ROAS faible",
    description: "ROAS en dessous de 1.5 sur les 3 derniers jours",
    category: "ads",
    check: async (supabase, userId) => {
      const { data } = await supabase
        .from("ad_daily_metrics")
        .select("spend, roas")
        .eq("user_id", userId)
        .gte("date", daysAgo(3).toISOString().split("T")[0])
        .order("date", { ascending: false });

      if (!data || data.length < 2) return null;

      const totalSpend = data.reduce((s, d) => s + (d.spend || 0), 0);
      if (totalSpend < 10) return null;

      const avgRoas = data.reduce((s, d) => s + (d.roas || 0), 0) / data.length;
      if (avgRoas < 1.5) {
        return {
          ruleId: "roas_low",
          severity: "danger" as const,
          title: "ROAS critique",
          message: `Ton ROAS moyen est de ${avgRoas.toFixed(2)} sur les ${data.length} derniers jours. Seuil recommandé : 1.5x minimum.`,
          link: "/ads",
        };
      }
      return null;
    },
  },
  {
    id: "cpa_high",
    name: "CPA élevé",
    description: "Coût par acquisition trop élevé",
    category: "ads",
    check: async (supabase, userId) => {
      const { data } = await supabase
        .from("ad_daily_metrics")
        .select("cpa, conversions")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(3);

      if (!data || data.length < 2) return null;
      const withConversions = data.filter((d) => d.conversions > 0);
      if (withConversions.length === 0) return null;

      const avgCpa =
        withConversions.reduce((s, d) => s + (d.cpa || 0), 0) /
        withConversions.length;
      if (avgCpa > 50) {
        return {
          ruleId: "cpa_high",
          severity: "warning" as const,
          title: "CPA élevé",
          message: `Ton coût par acquisition moyen est de ${avgCpa.toFixed(0)}€. Optimise tes créatives ou ton ciblage.`,
          link: "/ads",
        };
      }
      return null;
    },
  },
  {
    id: "budget_no_conversions",
    name: "Budget sans conversion",
    description: "Dépense publicitaire sans aucune conversion depuis 3 jours",
    category: "ads",
    check: async (supabase, userId) => {
      const { data } = await supabase
        .from("ad_daily_metrics")
        .select("spend, conversions")
        .eq("user_id", userId)
        .gte("date", daysAgo(3).toISOString().split("T")[0]);

      if (!data || data.length === 0) return null;

      const totalSpend = data.reduce((s, d) => s + (d.spend || 0), 0);
      const totalConversions = data.reduce(
        (s, d) => s + (d.conversions || 0),
        0,
      );

      if (totalSpend > 30 && totalConversions === 0) {
        return {
          ruleId: "budget_no_conversions",
          severity: "danger" as const,
          title: "Budget sans résultat",
          message: `${totalSpend.toFixed(0)}€ dépensés sans aucune conversion depuis ${data.length} jours. Revois tes campagnes.`,
          link: "/ads",
        };
      }
      return null;
    },
  },
  {
    id: "budget_waste",
    name: "Gaspillage budget pub",
    description: "Dépense > 100€ avec ROAS < 1 — perte nette",
    category: "ads",
    check: async (supabase, userId) => {
      const { data } = await supabase
        .from("ad_daily_metrics")
        .select("spend, roas, conversions")
        .eq("user_id", userId)
        .gte("date", daysAgo(7).toISOString().split("T")[0])
        .order("date", { ascending: false });

      if (!data || data.length < 2) return null;

      const totalSpend = data.reduce((s, d) => s + (d.spend || 0), 0);
      if (totalSpend < 100) return null; // Pas assez pour déclencher

      const avgRoas = data.reduce((s, d) => s + (d.roas || 0), 0) / data.length;
      if (avgRoas < 1) {
        return {
          ruleId: "budget_waste",
          severity: "danger" as const,
          title: "Gaspillage publicitaire détecté",
          message: `${totalSpend.toFixed(0)}€ dépensés cette semaine avec un ROAS de ${avgRoas.toFixed(2)}x — tu perds de l'argent. Coupe les campagnes non performantes immédiatement.`,
          link: "/ads",
        };
      }
      return null;
    },
  },

  // ══════════════════════════════════════════════════════════════
  // ACTIVITY
  // ══════════════════════════════════════════════════════════════
  {
    id: "procrastination",
    name: "Détecteur de procrastination",
    description: "Aucune génération IA depuis 3+ jours",
    category: "activity",
    check: async (supabase, userId) => {
      // Cherche la dernière génération IA (activity_type commence par "generation.")
      const { data: recent } = await supabase
        .from("activity_log")
        .select("created_at")
        .eq("user_id", userId)
        .like("activity_type", "generation.%")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!recent || recent.length === 0) {
        // Vérifier si l'utilisateur a déjà généré du contenu
        const { count } = await supabase
          .from("activity_log")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .like("activity_type", "generation.%");

        if ((count ?? 0) > 0) {
          return {
            ruleId: "procrastination",
            severity: "warning" as const,
            title: "Mode procrastination activé ?",
            message:
              "Tu n'as rien généré depuis un bon moment. Chaque jour sans action te coûte des clients potentiels — reprends le momentum !",
            link: "/roadmap",
          };
        }
        return null;
      }

      const lastGen = new Date(recent[0].created_at);
      const days = daysBetween(lastGen, new Date());

      if (days >= 3) {
        return {
          ruleId: "procrastination",
          severity: days >= 7 ? ("danger" as const) : ("warning" as const),
          title: "Mode procrastination activé ?",
          message: `Tu n'as rien généré depuis ${days} jours — reprends le momentum ! Chaque jour compte pour scaler.`,
          link: "/roadmap",
        };
      }
      return null;
    },
  },
  {
    id: "inactivity_week",
    name: "Semaine blanche",
    description: "Aucune activité (génération ou login) depuis 7+ jours",
    category: "activity",
    check: async (supabase, userId) => {
      const sevenDaysAgo = daysAgo(7);

      // Vérifie l'activité complète : générations + logins
      const { count: activityCount } = await supabase
        .from("activity_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", sevenDaysAgo.toISOString());

      // Vérifie aussi la date de dernière activité dans le profil
      const { data: profile } = await supabase
        .from("profiles")
        .select("last_active_date")
        .eq("id", userId)
        .single();

      const lastActiveDate = profile?.last_active_date
        ? new Date(profile.last_active_date)
        : null;

      const profileInactive =
        lastActiveDate && daysBetween(lastActiveDate, new Date()) >= 7;

      if (activityCount === 0 || profileInactive) {
        const inactiveDays = lastActiveDate
          ? daysBetween(lastActiveDate, new Date())
          : 7;

        return {
          ruleId: "inactivity_week",
          severity:
            inactiveDays >= 14 ? ("danger" as const) : ("warning" as const),
          title: "Semaine blanche détectée",
          message:
            inactiveDays >= 14
              ? `${inactiveDays} jours sans aucune activité. Ton business ne scale pas tout seul — reviens en action maintenant.`
              : `Aucune activité depuis ${inactiveDays} jours. La régularité est la clé du scaling — reconnecte-toi !`,
          link: "/roadmap",
        };
      }
      return null;
    },
  },
  {
    id: "streak_broken",
    name: "Streak cassé",
    description: "L'utilisateur avait un streak actif et l'a perdu",
    category: "activity",
    check: async (supabase, userId) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("streak_days, last_active_date")
        .eq("id", userId)
        .single();

      if (!profile) return null;

      const lastActive = profile.last_active_date
        ? new Date(profile.last_active_date)
        : null;
      if (!lastActive) return null;

      const days = daysBetween(lastActive, new Date());
      const streak = profile.streak_days || 0;

      // Streak en danger (1 jour sans activité, streak ≥ 3)
      if (days === 2 && streak >= 3) {
        return {
          ruleId: "streak_broken",
          severity: "warning" as const,
          title: "Ton streak est en danger !",
          message: `Tu as un streak de ${streak} jours — connecte-toi aujourd'hui pour ne pas le perdre !`,
          link: "/progress",
        };
      }

      // Streak perdu (2+ jours, streak était ≥ 5)
      if (days >= 3 && streak >= 5) {
        return {
          ruleId: "streak_broken",
          severity: "info" as const,
          title: "Streak perdu — relance le compteur",
          message: `Tu avais un streak de ${streak} jours, bravo ! Il a été cassé il y a ${days - 1} jour${days - 1 > 1 ? "s" : ""}. Recommence dès maintenant pour battre ton record.`,
          link: "/progress",
        };
      }
      return null;
    },
  },

  // ══════════════════════════════════════════════════════════════
  // CONTENT
  // ══════════════════════════════════════════════════════════════
  {
    id: "no_content_week",
    name: "Pas de contenu",
    description: "Aucun contenu généré depuis 7 jours",
    category: "content",
    check: async (supabase, userId) => {
      const { count } = await supabase
        .from("content_pieces")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", daysAgo(7).toISOString());

      if (count === 0) {
        const { count: totalCount } = await supabase
          .from("content_pieces")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if ((totalCount ?? 0) > 0) {
          return {
            ruleId: "no_content_week",
            severity: "warning" as const,
            title: "Contenu en pause",
            message:
              "Aucun contenu généré cette semaine. La régularité est essentielle pour l'algorithme.",
            link: "/content",
          };
        }
      }
      return null;
    },
  },
  {
    id: "low_engagement",
    name: "Engagement en baisse",
    description: "Les métriques d'engagement du contenu récent sont en déclin",
    category: "content",
    check: async (supabase, userId) => {
      // Récupère les 10 derniers contenus publiés avec des métriques
      const { data: recent } = await supabase
        .from("content_pieces")
        .select("views, likes, comments, shares, created_at")
        .eq("user_id", userId)
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!recent || recent.length < 6) return null;

      // Divise en 2 périodes : les 5 plus récents vs les 5 précédents
      const recentHalf = recent.slice(0, 5);
      const olderHalf = recent.slice(5, 10);

      const engagementScore = (items: typeof recent) => {
        const total = items.reduce(
          (sum, c) =>
            sum +
            (c.views || 0) +
            (c.likes || 0) * 3 +
            (c.comments || 0) * 5 +
            (c.shares || 0) * 4,
          0,
        );
        return total / items.length;
      };

      const recentScore = engagementScore(recentHalf);
      const olderScore = engagementScore(olderHalf);

      if (olderScore > 0 && recentScore < olderScore * 0.5) {
        const dropPercent = Math.round((1 - recentScore / olderScore) * 100);
        return {
          ruleId: "low_engagement",
          severity: "warning" as const,
          title: "Engagement en chute libre",
          message: `L'engagement de tes derniers contenus a baissé de ${dropPercent}%. Teste de nouveaux hooks ou formats pour relancer la machine.`,
          link: "/content",
        };
      }
      return null;
    },
  },

  // ══════════════════════════════════════════════════════════════
  // SALES
  // ══════════════════════════════════════════════════════════════
  {
    id: "pipeline_stalled",
    name: "Pipeline bloqué",
    description: "Aucune progression dans le pipeline depuis 14 jours",
    category: "sales",
    check: async (supabase, userId) => {
      const fourteenDaysAgo = daysAgo(14);

      const tables = ["offers", "funnels", "ad_creatives", "sales_assets"];
      let hasAnyData = false;
      let hasRecentData = false;

      for (const table of tables) {
        const { count: total } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if ((total ?? 0) > 0) hasAnyData = true;

        const { count: recent } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", fourteenDaysAgo.toISOString());

        if ((recent ?? 0) > 0) hasRecentData = true;
      }

      if (hasAnyData && !hasRecentData) {
        return {
          ruleId: "pipeline_stalled",
          severity: "warning" as const,
          title: "Pipeline au point mort",
          message:
            "Aucune nouvelle génération depuis 14 jours. Reprends là où tu en étais.",
          link: "/roadmap",
        };
      }
      return null;
    },
  },
];
