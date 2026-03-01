import type { LucideIcon } from "lucide-react";

// ─── Roles utilisateur ──────────────────────────────────────
export type UserRole = string;

// ─── Navigation ─────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  children?: NavItem[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

// ─── Notifications ──────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  body: string | null;
  type: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}
