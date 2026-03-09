"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Map } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const SKILL_CATEGORIES: Record<string, string[]> = {
  "Acquisition & Prospection": [
    "LinkedIn prospection", "Instagram DM", "Cold email", "Cold calling",
    "Setting", "Networking",
  ],
  "Vente & Closing": [
    "Call closing", "DM closing", "Redaction de propositions",
    "Negociation", "Upsell/Cross-sell",
  ],
  "Creation de Contenu": [
    "Reels/Short", "YouTube", "Copywriting",
    "Carousels", "Stories", "Podcasts", "Newsletters",
  ],
  "Marketing & Ads": [
    "Meta Ads", "Google Ads", "TikTok Ads", "SEO", "Influence/partenariats",
  ],
  "Delivery & Gestion Client": [
    "Coaching 1-on-1", "Coaching groupe", "Creation formation",
    "Gestion projet", "Consulting", "Done-for-you",
  ],
  "Automatisation & Outils": [
    "No-code", "CRM", "IA", "Montage video", "Design", "Developpement web",
  ],
};

export function VaultSkillMap() {
  const { user } = useUser();
  const [loading, setLoading] = React.useState(true);
  const [skills, setSkills] = React.useState<string[]>([]);
  const [vaultSkills, setVaultSkills] = React.useState<Record<string, string> | null>(null);

  React.useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("skills, vault_skills")
        .eq("id", user.id)
        .single();
      setSkills((data?.skills as string[]) || []);
      setVaultSkills((data?.vault_skills as Record<string, string>) || null);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return <AILoading text="Chargement de la cartographie" />;

  if (skills.length === 0) {
    return (
      <EmptyState
        icon={Map}
        title="Aucune competence"
        description="Complete l'onboarding pour visualiser ta cartographie."
      />
    );
  }

  // Calculate category scores
  const radarData = Object.entries(SKILL_CATEGORIES).map(([category, categorySkills]) => {
    let score = 0;
    let count = 0;

    categorySkills.forEach((skill) => {
      const hasSkill = skills.some(
        (s) => s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase())
      );
      if (hasSkill) {
        // Check proficiency level from vault_skills
        const level = vaultSkills?.[skill];
        if (level === "avance" || level === "avance") score += 3;
        else if (level === "intermediaire" || level === "intermediaire") score += 2;
        else score += 1;
        count++;
      }
    });

    return {
      category: category.split(" ")[0],
      fullName: category,
      score: count > 0 ? Math.round((score / (categorySkills.length * 3)) * 100) : 0,
      count,
      total: categorySkills.length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-accent" />
            Cartographie des competences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1C1F23" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: "#6B7280", fontSize: 10 }}
              />
              <Radar
                name="Maitrise"
                dataKey="score"
                stroke="#34D399"
                fill="#34D399"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#141719",
                  border: "1px solid #1C1F23",
                  borderRadius: "12px",
                  color: "#E5E7EB",
                }}
                formatter={(value: number | undefined) => [`${value ?? 0}%`, "Maitrise"]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category breakdown */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {radarData.map((cat) => (
          <Card key={cat.fullName}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-text-primary">{cat.fullName}</h4>
                <Badge variant={cat.score >= 50 ? "default" : "muted"}>
                  {cat.score}%
                </Badge>
              </div>
              <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${cat.score}%` }}
                />
              </div>
              <p className="text-xs text-text-muted mt-1">
                {cat.count} / {cat.total} competences
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
