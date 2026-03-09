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
  Archive,
  CreditCard,
  ShieldCheck,
  BarChart3,
  MessageSquare,
  Rocket,
} from "lucide-react";
import type { NavItem, NavSection } from "@/lib/types/appshell";

// ─── Tous les items de navigation ─────────────────────────────

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["user", "student", "admin", "coach"] },
  { label: "Vault", href: "/vault", icon: Archive, roles: ["user", "student", "admin", "coach"] },
  { label: "Marché", href: "/market", icon: Globe, roles: ["user", "student", "admin", "coach"] },
  { label: "Offre", href: "/offer", icon: Package, roles: ["user", "student", "admin", "coach"] },
  { label: "Marque", href: "/brand", icon: Palette, roles: ["user", "student", "admin", "coach"] },
  { label: "Funnel", href: "/funnel", icon: Filter, roles: ["user", "student", "admin", "coach"] },
  { label: "Assets", href: "/assets", icon: FileText, roles: ["user", "student", "admin", "coach"] },
  { label: "Ads", href: "/ads", icon: Megaphone, roles: ["user", "student", "admin", "coach"] },
  { label: "Contenu", href: "/content", icon: PenTool, roles: ["user", "student", "admin", "coach"] },
  { label: "Prospection", href: "/prospection", icon: MessageSquare, roles: ["user", "student", "admin", "coach"] },
  { label: "Vente", href: "/sales", icon: Handshake, roles: ["user", "student", "admin", "coach"] },
  { label: "Lancement", href: "/launch", icon: Rocket, roles: ["user", "student", "admin", "coach"] },
  { label: "Analytics", href: "/analytics", icon: BarChart3, roles: ["user", "student", "admin", "coach"] },
  { label: "Academy", href: "/academy", icon: GraduationCap, roles: ["user", "student", "admin", "coach"] },
  { label: "Roadmap", href: "/roadmap", icon: Map, roles: ["user", "student", "admin", "coach"] },
  { label: "Progression", href: "/progress", icon: TrendingUp, roles: ["user", "student", "admin", "coach"] },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy, roles: ["user", "student", "admin", "coach"] },
  { label: "Communauté", href: "/community", icon: Users, roles: ["user", "student", "admin", "coach"] },
  { label: "Assistant IA", href: "/assistant", icon: Bot, roles: ["user", "student", "admin", "coach"] },
  { label: "Tarifs", href: "/pricing", icon: CreditCard, roles: ["user", "student", "admin", "coach"] },
  { label: "Admin", href: "/admin", icon: ShieldCheck, roles: ["admin"] },
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
      ["/vault", "/market", "/offer", "/brand"].includes(i.href)
    ),
  },
  {
    label: "Acquisition",
    items: NAV_ITEMS.filter((i) =>
      ["/funnel", "/assets", "/ads", "/content", "/prospection", "/sales"].includes(i.href)
    ),
  },
  {
    label: "Performance",
    items: NAV_ITEMS.filter((i) =>
      ["/launch", "/analytics"].includes(i.href)
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
      ["/assistant", "/pricing", "/admin"].includes(i.href)
    ),
  },
];

// ─── Labels breadcrumb ────────────────────────────────────────

export const BREADCRUMB_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  vault: "Vault",
  market: "Marché",
  offer: "Offre",
  brand: "Marque",
  funnel: "Funnel",
  assets: "Assets",
  ads: "Publicités",
  content: "Contenu",
  prospection: "Prospection",
  sales: "Vente",
  launch: "Lancement",
  analytics: "Analytics",
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
  { label: "Vault", href: "/vault", icon: Archive },
  { label: "Offre", href: "/offer", icon: Package },
  { label: "Marché", href: "/market", icon: Globe },
  { label: "Funnel", href: "/funnel", icon: Filter },
  { label: "Assets", href: "/assets", icon: FileText },
  { label: "Ads", href: "/ads", icon: Megaphone },
  { label: "Contenu", href: "/content", icon: PenTool },
  { label: "Prospection", href: "/prospection", icon: MessageSquare },
  { label: "Vente", href: "/sales", icon: Handshake },
  { label: "Lancement", href: "/launch", icon: Rocket },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Academy", href: "/academy", icon: GraduationCap },
  { label: "Roadmap", href: "/roadmap", icon: Map },
  { label: "Assistant IA", href: "/assistant", icon: Bot },
  { label: "Communauté", href: "/community", icon: Users },
  { label: "Paramètres", href: "/settings", icon: Settings },
  { label: "Tarifs", href: "/pricing", icon: CreditCard },
  { label: "Admin", href: "/admin", icon: ShieldCheck },
];
