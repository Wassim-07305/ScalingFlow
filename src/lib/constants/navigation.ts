import {
  LayoutDashboard,
  Globe,
  Package,
  Palette,
  Filter,
  FileText,
  Megaphone,
  PenTool,
  GraduationCap,
  Map,
  TrendingUp,
  Trophy,
  Users,
  Handshake,
  Bot,
  Settings,
} from "lucide-react";
import type { NavItem, NavSection } from "@/lib/types/appshell";

// ─── Tous les items de navigation ─────────────────────────────

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["user", "student", "admin", "coach"] },
  { label: "Marché", href: "/market", icon: Globe, roles: ["user", "student", "admin", "coach"] },
  { label: "Offre", href: "/offer", icon: Package, roles: ["user", "student", "admin", "coach"] },
  { label: "Marque", href: "/brand", icon: Palette, roles: ["user", "student", "admin", "coach"] },
  { label: "Funnel", href: "/funnel", icon: Filter, roles: ["user", "student", "admin", "coach"] },
  { label: "Assets", href: "/assets", icon: FileText, roles: ["user", "student", "admin", "coach"] },
  { label: "Ads", href: "/ads", icon: Megaphone, roles: ["user", "student", "admin", "coach"] },
  { label: "Contenu", href: "/content", icon: PenTool, roles: ["user", "student", "admin", "coach"] },
  { label: "Vente", href: "/sales", icon: Handshake, roles: ["user", "student", "admin", "coach"] },
  { label: "Academy", href: "/academy", icon: GraduationCap, roles: ["user", "student", "admin", "coach"] },
  { label: "Roadmap", href: "/roadmap", icon: Map, roles: ["user", "student", "admin", "coach"] },
  { label: "Progression", href: "/progress", icon: TrendingUp, roles: ["user", "student", "admin", "coach"] },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy, roles: ["user", "student", "admin", "coach"] },
  { label: "Communauté", href: "/community", icon: Users, roles: ["user", "student", "admin", "coach"] },
  { label: "Assistant IA", href: "/assistant", icon: Bot, roles: ["user", "student", "admin", "coach"] },
];

// ─── Sections sidebar ─────────────────────────────────────────

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "",
    items: NAV_ITEMS.filter((i) => i.href === "/"),
  },
  {
    label: "Business",
    items: NAV_ITEMS.filter((i) =>
      ["/market", "/offer", "/brand"].includes(i.href)
    ),
  },
  {
    label: "Acquisition",
    items: NAV_ITEMS.filter((i) =>
      ["/funnel", "/assets", "/ads", "/content", "/sales"].includes(i.href)
    ),
  },
  {
    label: "Formation",
    items: NAV_ITEMS.filter((i) =>
      ["/academy", "/roadmap"].includes(i.href)
    ),
  },
  {
    label: "Gamification",
    items: NAV_ITEMS.filter((i) =>
      ["/progress", "/leaderboard", "/community"].includes(i.href)
    ),
  },
  {
    label: "Outils",
    items: NAV_ITEMS.filter((i) =>
      ["/assistant"].includes(i.href)
    ),
  },
];

// ─── Labels breadcrumb ────────────────────────────────────────

export const BREADCRUMB_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  market: "Marché",
  offer: "Offre",
  brand: "Marque",
  funnel: "Funnel",
  assets: "Assets",
  ads: "Publicités",
  content: "Contenu",
  sales: "Vente",
  academy: "Academy",
  roadmap: "Roadmap",
  progress: "Progression",
  leaderboard: "Leaderboard",
  community: "Communauté",
  assistant: "Assistant IA",
  settings: "Paramètres",
  admin: "Administration",
  pricing: "Tarifs",
};

// ─── Quick links (Cmd+K) ─────────────────────────────────────

export const QUICK_LINKS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Offre", href: "/offer", icon: Package },
  { label: "Marché", href: "/market", icon: Globe },
  { label: "Funnel", href: "/funnel", icon: Filter },
  { label: "Assets", href: "/assets", icon: FileText },
  { label: "Ads", href: "/ads", icon: Megaphone },
  { label: "Contenu", href: "/content", icon: PenTool },
  { label: "Academy", href: "/academy", icon: GraduationCap },
  { label: "Roadmap", href: "/roadmap", icon: Map },
  { label: "Vente", href: "/sales", icon: Handshake },
  { label: "Assistant IA", href: "/assistant", icon: Bot },
  { label: "Communauté", href: "/community", icon: Users },
  { label: "Paramètres", href: "/settings", icon: Settings },
];
