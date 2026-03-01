"use client";

import { Menu, Search } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { useUser } from "@/hooks/use-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/layout/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";
import { useRouter } from "next/navigation";

export function Topbar() {
  const { sidebarCollapsed, setSidebarMobileOpen } = useAppStore();
  const { profile, signOut } = useUser();
  const router = useRouter();

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "SF";

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border-default bg-bg-primary/90 backdrop-blur-sm px-6 transition-all duration-200",
        sidebarCollapsed ? "lg:ml-[64px]" : "lg:ml-[220px]"
      )}
    >
      {/* Left: Mobile menu + Search */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarMobileOpen(true)}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-[6px] text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors duration-150"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 rounded-[8px] bg-bg-tertiary border border-border-default px-3 py-1.5 w-60">
          <Search className="h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>
      </div>

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <NotificationBell />

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-[8px] p-1.5 hover:bg-bg-tertiary transition-colors duration-150">
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium text-text-primary max-w-[120px] truncate">
                {profile?.full_name || "Utilisateur"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{profile?.full_name}</span>
                <span className="text-xs text-text-secondary">{profile?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-danger focus:text-danger">
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
