"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useUIStore } from "@/stores/ui-store";
import type { LucideIcon } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

interface QuickLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface GlobalSearchProps {
  quickLinks: QuickLink[];
  placeholder?: string;
}

// ─── Component ──────────────────────────────────────────────

export function GlobalSearch({
  quickLinks,
  placeholder = "Rechercher une page...",
}: GlobalSearchProps) {
  const router = useRouter();
  const { searchOpen, setSearchOpen } = useUIStore();

  // Keyboard shortcut: Cmd+K
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    },
    [searchOpen, setSearchOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function handleSelect(href: string) {
    setSearchOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={searchOpen}
      onOpenChange={setSearchOpen}
      title="Recherche"
      description="Rechercher dans l'application"
    >
      <CommandInput placeholder={placeholder} />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

        <CommandGroup heading="Navigation rapide">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <CommandItem
                key={link.href}
                onSelect={() => handleSelect(link.href)}
                className="gap-3"
              >
                <Icon className="h-4 w-4 text-text-muted" />
                <span>{link.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
