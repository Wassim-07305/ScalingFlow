"use client";

import Link from "next/link";
import {
  Package,
  Filter,
  Megaphone,
  PenTool,
  FileText,
  Handshake,
  ArrowRight,
  MessageSquare,
  Rocket,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const actions = [
  {
    label: "Créer une offre",
    description: "Génère ton positionnement, pricing et garanties",
    href: "/offer",
    icon: Package,
    color: "orange" as const,
  },
  {
    label: "Générer un funnel",
    description: "Page opt-in, VSL et remerciement",
    href: "/funnel",
    icon: Filter,
    color: "blue" as const,
  },
  {
    label: "Créer des pubs",
    description: "Hooks, créatives et scripts video",
    href: "/ads/creatives",
    icon: Megaphone,
    color: "cyan" as const,
  },
  {
    label: "Générer du contenu",
    description: "Reels, posts, stories et carrousels",
    href: "/content",
    icon: PenTool,
    color: "purple" as const,
  },
  {
    label: "Prospection",
    description: "Scripts DM, appels et workflow outbound",
    href: "/prospection",
    icon: MessageSquare,
    color: "cyan" as const,
  },
  {
    label: "Scripts de vente",
    description: "Scripts de closing et traitement objections",
    href: "/sales",
    icon: Handshake,
    color: "blue" as const,
  },
  {
    label: "Guide lancement",
    description: "Checklist 10 jours pour lancer tes ads",
    href: "/launch",
    icon: Rocket,
    color: "orange" as const,
  },
  {
    label: "Analytics",
    description: "Performance, A/B tests et optimisations IA",
    href: "/analytics",
    icon: BarChart3,
    color: "purple" as const,
  },
];

const colorStyles = {
  orange: {
    bg: "bg-accent/10",
    text: "text-accent",
    hover: "hover:border-accent/30 hover:shadow-[0_0_20px_rgba(52,211,153,0.06)]",
  },
  blue: {
    bg: "bg-info/10",
    text: "text-info",
    hover: "hover:border-info/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.06)]",
  },
  cyan: {
    bg: "bg-accent/10",
    text: "text-accent",
    hover: "hover:border-accent/30 hover:shadow-[0_0_20px_rgba(52,211,153,0.06)]",
  },
  purple: {
    bg: "bg-[rgba(139,92,246,0.10)]",
    text: "text-[#A78BFA]",
    hover: "hover:border-[#A78BFA]/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.06)]",
  },
};

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions rapides</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action) => {
            const colors = colorStyles[action.color];
            return (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  "group flex items-start gap-3 rounded-2xl border border-white/5 bg-bg-secondary p-4 transition-all duration-300 hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                  colors.hover
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                    colors.bg
                  )}
                >
                  <action.icon className={cn("h-5 w-5", colors.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-text-primary">
                      {action.label}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-text-muted opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 line-clamp-2 sm:line-clamp-1">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
