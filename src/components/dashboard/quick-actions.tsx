"use client";

import Link from "next/link";
import {
  Package,
  Filter,
  Megaphone,
  PenTool,
  FileText,
  Handshake,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const actions = [
  {
    label: "Créer une offre",
    href: "/offer",
    icon: Package,
    color: "orange" as const,
  },
  {
    label: "Générer un funnel",
    href: "/funnel",
    icon: Filter,
    color: "blue" as const,
  },
  {
    label: "Créer des pubs",
    href: "/ads/creatives",
    icon: Megaphone,
    color: "cyan" as const,
  },
  {
    label: "Générer du contenu",
    href: "/content",
    icon: PenTool,
    color: "purple" as const,
  },
  {
    label: "Sales assets",
    href: "/assets",
    icon: FileText,
    color: "orange" as const,
  },
  {
    label: "Scripts de vente",
    href: "/sales",
    icon: Handshake,
    color: "blue" as const,
  },
];

const colorStyles = {
  orange: "bg-neon-orange-glow text-neon-orange hover:shadow-[0_0_20px_rgba(255,107,44,0.2)]",
  blue: "bg-neon-blue-glow text-neon-blue hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]",
  cyan: "bg-neon-cyan-glow text-neon-cyan hover:shadow-[0_0_20px_rgba(6,214,160,0.2)]",
  purple: "bg-neon-purple-glow text-neon-purple hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]",
};

export function QuickActions() {
  return (
    <div>
      <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] text-text-primary mb-4">
        Actions rapides
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              "flex flex-col items-center gap-2 rounded-[16px] border border-border-default bg-bg-secondary p-4 transition-all duration-300 hover:border-border-hover",
              colorStyles[action.color]
            )}
          >
            <action.icon className="h-6 w-6" />
            <span className="text-xs font-medium text-center">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
