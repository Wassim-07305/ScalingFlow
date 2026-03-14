import {
  LayoutDashboard,
  Compass,
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
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Onboarding", href: "/onboarding", icon: Compass },
  { label: "Marché", href: "/market", icon: Globe },
  { label: "Offre", href: "/offer", icon: Package },
  { label: "Marque", href: "/brand", icon: Palette },
  { label: "Funnel", href: "/funnel", icon: Filter },
  { label: "Assets", href: "/assets", icon: FileText },
  { label: "Ads", href: "/ads", icon: Megaphone },
  { label: "Contenu", href: "/content", icon: PenTool },
  { label: "Academy", href: "/academy", icon: GraduationCap },
  { label: "Roadmap", href: "/roadmap", icon: Map },
  { label: "Progression", href: "/progress", icon: TrendingUp },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Communauté", href: "/community", icon: Users },
  { label: "Vente", href: "/sales", icon: Handshake },
  { label: "Assistant IA", href: "/assistant", icon: Bot },
];

export const NAV_BOTTOM: NavItem[] = [
  { label: "Paramètres", href: "/settings", icon: Settings },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Offre", href: "/offer", icon: Package },
  { label: "Academy", href: "/academy", icon: GraduationCap },
  { label: "Roadmap", href: "/roadmap", icon: Map },
  { label: "Communauté", href: "/community", icon: Users },
];
