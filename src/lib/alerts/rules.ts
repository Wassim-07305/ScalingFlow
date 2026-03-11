import { SupabaseClient } from "@supabase/supabase-js";

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: "ads" | "activity" | "sales" | "content";
  check: (supabase: SupabaseClient, userId: string) => Promise<AlertResult | null>;
}

export interface AlertResult {
  ruleId: string;
  severity: "warning" | "danger" | "info";
  title: string;
  message: string;
  link?: string;
}

// ─── Alert Rules ─────────────────────────────────────────────

export const ALERT_RULES: AlertRule[] = [
  // === ADS ===
  {
    id: "roas_low",
    name: "ROAS faible",
    description: "ROAS en dessous de 1.5 sur les 3 derniers jours",
    category: "ads",
    check: async (supabase, userId) => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const { data } = await supabase
        .from("ad_daily_metrics")
        .select("spend, roas")
        .eq("user_id", userId)
        .gte("date", threeDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: false });

      if (!data || data.length < 2) return null;

      const totalSpend = data.reduce((s, d) => s + (d.spend || 0), 0);
      if (totalSpend < 10) return null; // Pas assez de budget pour alerter

      const avgRoas = data.reduce((s, d) => s + (d.roas || 0), 0) / data.length;
      if (avgRoas < 1.5) {
        return {
          ruleId: "roas_low",
          severity: "danger" as const,
          title: "ROAS critique",
          message: `Ton ROAS moyen est de ${avgRoas.toFixed(2)} sur les ${data.length} derniers jours. Seuil recommande : 1.5x minimum.`,
          link: "/ads",
        };
      }
      return null;
    },
  },
  {
    id: "cpa_high",
    name: "CPA eleve",
    description: "Cout par acquisition trop eleve",
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

      const avgCpa = withConversions.reduce((s, d) => s + (d.cpa || 0), 0) / withConversions.length;
      // Alert if CPA > 50€ (threshold for most niches)
      if (avgCpa > 50) {
        return {
          ruleId: "cpa_high",
          severity: "warning" as const,
          title: "CPA eleve",
          message: `Ton cout par acquisition moyen est de ${avgCpa.toFixed(0)}€. Optimise tes creatives ou ton ciblage.`,
          link: "/ads",
        };
      }
      return null;
    },
  },
  {
    id: "budget_no_conversions",
    name: "Budget sans conversion",
    description: "Depense publicitaire sans aucune conversion depuis 3 jours",
    category: "ads",
    check: async (supabase, userId) => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const { data } = await supabase
        .from("ad_daily_metrics")
        .select("spend, conversions")
        .eq("user_id", userId)
        .gte("date", threeDaysAgo.toISOString().split("T")[0]);

      if (!data || data.length === 0) return null;

      const totalSpend = data.reduce((s, d) => s + (d.spend || 0), 0);
      const totalConversions = data.reduce((s, d) => s + (d.conversions || 0), 0);

      if (totalSpend > 30 && totalConversions === 0) {
        return {
          ruleId: "budget_no_conversions",
          severity: "danger" as const,
          title: "Budget sans resultat",
          message: `${totalSpend.toFixed(0)}€ depenses sans aucune conversion depuis ${data.length} jours. Revois tes campagnes.`,
          link: "/ads",
        };
      }
      return null;
    },
  },

  // === ACTIVITY ===
  {
    id: "inactivity_week",
    name: "Semaine blanche",
    description: "Aucune activite depuis 7 jours",
    category: "activity",
    check: async (supabase, userId) => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count } = await supabase
        .from("activity_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", sevenDaysAgo.toISOString());

      if (count === 0) {
        return {
          ruleId: "inactivity_week",
          severity: "warning" as const,
          title: "Semaine blanche detectee",
          message: "Tu n'as eu aucune activite depuis 7 jours. La regularite est la cle du scaling.",
          link: "/roadmap",
        };
      }
      return null;
    },
  },
  {
    id: "streak_broken",
    name: "Streak perdu",
    description: "Tu as perdu ton streak de regularite",
    category: "activity",
    check: async (supabase, userId) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("streak_days, last_active_date")
        .eq("id", userId)
        .single();

      if (!profile) return null;

      const lastActive = profile.last_active_date ? new Date(profile.last_active_date) : null;
      const now = new Date();

      if (lastActive) {
        const daysDiff = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 2 && (profile.streak_days || 0) >= 3) {
          return {
            ruleId: "streak_broken",
            severity: "info" as const,
            title: "Streak en danger !",
            message: `Tu avais un streak de ${profile.streak_days} jours. Connecte-toi aujourd'hui pour ne pas le perdre.`,
            link: "/progress",
          };
        }
      }
      return null;
    },
  },

  // === CONTENT ===
  {
    id: "no_content_week",
    name: "Pas de contenu",
    description: "Aucun contenu genere depuis 7 jours",
    category: "content",
    check: async (supabase, userId) => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count } = await supabase
        .from("content_pieces")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", sevenDaysAgo.toISOString());

      if (count === 0) {
        // Check if user has any content at all (skip if brand new)
        const { count: totalCount } = await supabase
          .from("content_pieces")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if ((totalCount ?? 0) > 0) {
          return {
            ruleId: "no_content_week",
            severity: "warning" as const,
            title: "Contenu en pause",
            message: "Aucun contenu genere cette semaine. La regularite est essentielle pour l'algorithme.",
            link: "/content",
          };
        }
      }
      return null;
    },
  },

  // === SALES ===
  {
    id: "pipeline_stalled",
    name: "Pipeline bloque",
    description: "Aucune progression dans le pipeline depuis 14 jours",
    category: "sales",
    check: async (supabase, userId) => {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      // Check if user has started the pipeline but nothing new in 14 days
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
          message: "Aucune nouvelle generation depuis 14 jours. Reprends la ou tu en etais.",
          link: "/roadmap",
        };
      }
      return null;
    },
  },
];
