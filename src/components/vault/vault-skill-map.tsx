"use client";

import React, { useState, useMemo} from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils/cn";
import { Map, Network } from "lucide-react";
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
    "LinkedIn prospection",
    "Instagram DM",
    "Cold email",
    "Cold calling",
    "Setting",
    "Networking",
  ],
  "Vente & Closing": [
    "Call closing",
    "DM closing",
    "Redaction de propositions",
    "Négociation",
    "Upsell/Cross-sell",
  ],
  "Création de Contenu": [
    "Reels/Short",
    "YouTube",
    "Copywriting",
    "Carousels",
    "Stories",
    "Podcasts",
    "Newsletters",
  ],
  "Marketing & Ads": [
    "Meta Ads",
    "Google Ads",
    "TikTok Ads",
    "SEO",
    "Influence/partenariats",
  ],
  "Delivery & Gestion Client": [
    "Coaching 1-on-1",
    "Coaching groupe",
    "Création formation",
    "Gestion projet",
    "Consulting",
    "Done-for-you",
  ],
  "Automatisation & Outils": [
    "No-code",
    "CRM",
    "IA",
    "Montage vidéo",
    "Design",
    "Développement web",
  ],
  "Stratégie & Business": [
    "Business plan",
    "Stratégie de pricing",
    "Personal branding",
    "Management d'équipe",
    "Finance / comptabilité",
  ],
};

// ─── Mindmap component ───────────────────────────────────────
const CATEGORY_COLORS = [
  "#3B82F6", // blue
  "#34D399", // emerald
  "#F59E0B", // amber
  "#A78BFA", // purple
  "#F87171", // red
  "#06B6D4", // cyan
  "#EC4899", // pink (7th category)
];

function SkillMindmap({
  skills,
  categories,
  radarData,
}: {
  skills: string[];
  categories: Record<string, string[]>;
  radarData: { fullName: string; score: number; count: number }[];
}) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const entries = Object.entries(categories);
  const cx = 400;
  const cy = 300;
  const catRadius = 180;
  const skillRadius = 60;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox="0 0 800 600"
        className="w-full min-w-[600px]"
        style={{ maxHeight: 500 }}
      >
        {/* Lines from center to categories */}
        {entries.map(([catName], catIdx) => {
          const angle = (catIdx / entries.length) * 2 * Math.PI - Math.PI / 2;
          const catX = cx + Math.cos(angle) * catRadius;
          const catY = cy + Math.sin(angle) * catRadius;
          const color = CATEGORY_COLORS[catIdx % CATEGORY_COLORS.length];

          return (
            <line
              key={`line-${catName}`}
              x1={cx}
              y1={cy}
              x2={catX}
              y2={catY}
              stroke={color}
              strokeWidth={hoveredCategory === catName ? 3 : 1.5}
              strokeOpacity={
                hoveredCategory && hoveredCategory !== catName ? 0.2 : 0.6
              }
            />
          );
        })}

        {/* Category nodes + skill branches */}
        {entries.map(([catName, catSkills], catIdx) => {
          const angle = (catIdx / entries.length) * 2 * Math.PI - Math.PI / 2;
          const catX = cx + Math.cos(angle) * catRadius;
          const catY = cy + Math.sin(angle) * catRadius;
          const color = CATEGORY_COLORS[catIdx % CATEGORY_COLORS.length];
          const rd = radarData.find((r) => r.fullName === catName);
          const isHovered = hoveredCategory === catName;
          const isOtherHovered = hoveredCategory && hoveredCategory !== catName;

          // Matched skills in this category
          const matchedSkills = catSkills.filter((s) =>
            skills.some(
              (us) =>
                us.toLowerCase().includes(s.toLowerCase()) ||
                s.toLowerCase().includes(us.toLowerCase()),
            ),
          );

          // Position skill nodes around the category
          const spreadAngle = Math.PI * 0.6;
          const startAngle = angle - spreadAngle / 2;

          return (
            <g
              key={catName}
              onMouseEnter={() => setHoveredCategory(catName)}
              onMouseLeave={() => setHoveredCategory(null)}
              style={{ cursor: "pointer" }}
              opacity={isOtherHovered ? 0.25 : 1}
            >
              {/* Skill branch lines + nodes */}
              {catSkills.map((skill, sIdx) => {
                const sAngle =
                  startAngle +
                  (sIdx / Math.max(catSkills.length - 1, 1)) * spreadAngle;
                const sX = catX + Math.cos(sAngle) * skillRadius;
                const sY = catY + Math.sin(sAngle) * skillRadius;
                const isActive = matchedSkills.includes(skill);

                return (
                  <g key={skill}>
                    <line
                      x1={catX}
                      y1={catY}
                      x2={sX}
                      y2={sY}
                      stroke={isActive ? color : "#374151"}
                      strokeWidth={1}
                      strokeOpacity={isHovered ? 0.8 : 0.3}
                    />
                    <circle
                      cx={sX}
                      cy={sY}
                      r={isActive ? 5 : 3}
                      fill={isActive ? color : "#374151"}
                      opacity={isHovered ? 1 : 0.5}
                    />
                    {isHovered && (
                      <text
                        x={sX}
                        y={sY - 8}
                        textAnchor="middle"
                        fontSize={8}
                        fill={isActive ? "#F9FAFB" : "#6B7280"}
                        fontWeight={isActive ? "bold" : "normal"}
                      >
                        {skill}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Category node */}
              <circle
                cx={catX}
                cy={catY}
                r={isHovered ? 24 : 20}
                fill={`${color}20`}
                stroke={color}
                strokeWidth={2}
              />
              <text
                x={catX}
                y={catY + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fill="#F9FAFB"
                fontWeight="bold"
              >
                {rd?.score ?? 0}%
              </text>
              <text
                x={catX}
                y={catY + (isHovered ? 36 : 32)}
                textAnchor="middle"
                fontSize={10}
                fill={color}
                fontWeight="600"
              >
                {catName.split(" ")[0]}
              </text>
            </g>
          );
        })}

        {/* Center node */}
        <circle
          cx={cx}
          cy={cy}
          r={30}
          fill="#34D39920"
          stroke="#34D399"
          strokeWidth={2}
        />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize={10}
          fill="#34D399"
          fontWeight="bold"
        >
          Mes
        </text>
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fontSize={10}
          fill="#34D399"
          fontWeight="bold"
        >
          Skills
        </text>
      </svg>
      <p className="text-xs text-text-muted text-center mt-2">
        Survole une catégorie pour voir les compétences individuelles
      </p>
    </div>
  );
}

export function VaultSkillMap() {
  const { user } = useUser();
  const [loading, setLoading] = React.useState(true);
  const [skills, setSkills] = React.useState<string[]>([]);
  const [vaultSkills, setVaultSkills] = React.useState<Record<
    string,
    string
  > | null>(null);

  React.useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const supabase = useMemo(() => createClient(), []);
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
        title="Aucune compétence"
        description="Complète l'onboarding pour visualiser ta cartographie."
      />
    );
  }

  // Calculate category scores
  const radarData = Object.entries(SKILL_CATEGORIES).map(
    ([category, categorySkills]) => {
      let score = 0;
      let count = 0;

      categorySkills.forEach((skill) => {
        const hasSkill = skills.some(
          (s) =>
            s.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(s.toLowerCase()),
        );
        if (hasSkill) {
          // Check proficiency level from vault_skills
          const level = vaultSkills?.[skill];
          if (level === "avance" || level === "avance") score += 3;
          else if (level === "intermediaire" || level === "intermediaire")
            score += 2;
          else score += 1;
          count++;
        }
      });

      return {
        category: category.split(" ")[0],
        fullName: category,
        score:
          count > 0
            ? Math.round((score / (categorySkills.length * 3)) * 100)
            : 0,
        count,
        total: categorySkills.length,
      };
    },
  );

  return (
    <div className="space-y-6">
      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-accent" />
            Cartographie des compétences
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
                name="Maîtrise"
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
                formatter={(value: number | undefined) => [
                  `${value ?? 0}%`,
                  "Maîtrise",
                ]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Mindmap visualisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-accent" />
            Mindmap des compétences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SkillMindmap
            skills={skills}
            categories={SKILL_CATEGORIES}
            radarData={radarData}
          />
        </CardContent>
      </Card>

      {/* Category breakdown */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {radarData.map((cat) => (
          <Card key={cat.fullName}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-text-primary">
                  {cat.fullName}
                </h4>
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
                {cat.count} / {cat.total} compétences
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
