"use client";

import { Bell, Menu, Search } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { useUser } from "@/hooks/use-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
        "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-default bg-bg-primary/80 backdrop-blur-xl px-6 transition-all duration-300",
        sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"
      )}
    >
      {/* Left: Mobile menu + Search */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarMobileOpen(true)}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-[8px] text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 rounded-[12px] bg-bg-tertiary border border-border-default px-3 py-2 w-64">
          <Search className="h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>
      </div>

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-neon-orange shadow-[0_0_6px_rgba(255,107,44,0.5)]" />
        </Button>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-[12px] p-1.5 hover:bg-bg-tertiary transition-colors">
              <Avatar className="h-8 w-8">
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
            <DropdownMenuItem onClick={handleSignOut} className="text-neon-red focus:text-neon-red">
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
