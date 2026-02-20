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
  orange: "bg-accent-muted text-accent",
  blue: "bg-info/12 text-info",
  cyan: "bg-accent-muted text-accent",
  purple: "bg-[rgba(139,92,246,0.12)] text-[#A78BFA]",
};

export function QuickActions() {
  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Actions rapides
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              "flex flex-col items-center gap-2 rounded-[12px] border border-border-default bg-bg-secondary p-4 transition-all duration-300 hover:border-border-hover",
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
