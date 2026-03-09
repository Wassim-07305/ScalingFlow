"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { useUIStore } from "@/stores/ui-store";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import {
  Package,
  Filter,
  Megaphone,
  PenTool,
  FileText,
  Handshake,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

interface QuickLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface SearchResult {
  id: string;
  title: string;
  type: "offer" | "funnel" | "ad" | "content" | "asset" | "sale";
  href: string;
  icon: LucideIcon;
}

interface GlobalSearchProps {
  quickLinks: QuickLink[];
  placeholder?: string;
}

const TYPE_META: Record<
  SearchResult["type"],
  { label: string; icon: LucideIcon }
> = {
  offer: { label: "Offres", icon: Package },
  funnel: { label: "Funnels", icon: Filter },
  ad: { label: "Publicités", icon: Megaphone },
  content: { label: "Contenus", icon: PenTool },
  asset: { label: "Assets", icon: FileText },
  sale: { label: "Vente", icon: Handshake },
};

// ─── Component ──────────────────────────────────────────────

export function GlobalSearch({
  quickLinks,
  placeholder = "Rechercher pages, offres, funnels...",
}: GlobalSearchProps) {
  const router = useRouter();
  const { searchOpen, setSearchOpen } = useUIStore();
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

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

  // Reset on close
  useEffect(() => {
    if (!searchOpen) {
      setQuery("");
      setResults([]);
    }
  }, [searchOpen]);

  // Search Supabase when query changes
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2 || !user) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const supabase = createClient();
        const q = `%${query.trim()}%`;

        const [offers, funnels, ads, content, assets] = await Promise.all([
          supabase
            .from("offers")
            .select("id, offer_name")
            .eq("user_id", user.id)
            .ilike("offer_name", q)
            .limit(5)
            .abortSignal(controller.signal),
          supabase
            .from("funnels")
            .select("id, funnel_name")
            .eq("user_id", user.id)
            .ilike("funnel_name", q)
            .limit(5)
            .abortSignal(controller.signal),
          supabase
            .from("ad_creatives")
            .select("id, headline")
            .eq("user_id", user.id)
            .ilike("headline", q)
            .limit(5)
            .abortSignal(controller.signal),
          supabase
            .from("content_pieces")
            .select("id, title")
            .eq("user_id", user.id)
            .ilike("title", q)
            .limit(5)
            .abortSignal(controller.signal),
          supabase
            .from("sales_assets")
            .select("id, asset_name")
            .eq("user_id", user.id)
            .ilike("asset_name", q)
            .limit(5)
            .abortSignal(controller.signal),
        ]);

        if (controller.signal.aborted) return;

        const all: SearchResult[] = [
          ...(offers.data ?? []).map((r) => ({
            id: r.id,
            title: r.offer_name || "Offre sans nom",
            type: "offer" as const,
            href: `/offer`,
            icon: Package,
          })),
          ...(funnels.data ?? []).map((r) => ({
            id: r.id,
            title: r.funnel_name || "Funnel sans nom",
            type: "funnel" as const,
            href: `/funnel`,
            icon: Filter,
          })),
          ...(ads.data ?? []).map((r) => ({
            id: r.id,
            title: r.headline || "Pub sans titre",
            type: "ad" as const,
            href: `/ads`,
            icon: Megaphone,
          })),
          ...(content.data ?? []).map((r) => ({
            id: r.id,
            title: r.title || "Contenu sans titre",
            type: "content" as const,
            href: `/content`,
            icon: PenTool,
          })),
          ...(assets.data ?? []).map((r) => ({
            id: r.id,
            title: r.asset_name || "Asset sans nom",
            type: "asset" as const,
            href: `/assets`,
            icon: FileText,
          })),
        ];

        setResults(all);
      } catch {
        // Silently handle abort/network errors
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, user]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    for (const result of results) {
      if (!groups[result.type]) groups[result.type] = [];
      groups[result.type].push(result);
    }
    return groups;
  }, [results]);

  function handleSelect(href: string) {
    setSearchOpen(false);
    router.push(href);
  }

  const hasResults = results.length > 0;
  const hasQuery = query.trim().length >= 2;

  return (
    <CommandDialog
      open={searchOpen}
      onOpenChange={setSearchOpen}
      title="Recherche"
      description="Rechercher dans l'application"
    >
      <CommandInput
        placeholder={placeholder}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {/* Loading state */}
        {searching && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Recherche...
          </div>
        )}

        {/* Empty state */}
        {!searching && hasQuery && !hasResults && (
          <CommandEmpty>Aucun résultat pour &ldquo;{query}&rdquo;</CommandEmpty>
        )}

        {/* Search results grouped by type */}
        {!searching &&
          Object.entries(groupedResults).map(([type, items]) => {
            const meta = TYPE_META[type as SearchResult["type"]];
            return (
              <CommandGroup key={type} heading={meta.label}>
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.id}
                      value={item.title}
                      onSelect={() => handleSelect(item.href)}
                      className="gap-3"
                    >
                      <Icon className="h-4 w-4 text-text-muted" />
                      <span className="truncate">{item.title}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            );
          })}

        {/* Separator between results and nav */}
        {hasResults && <CommandSeparator className="my-2" />}

        {/* Quick navigation links */}
        <CommandGroup heading="Navigation rapide">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <CommandItem
                key={link.href}
                value={link.label}
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
