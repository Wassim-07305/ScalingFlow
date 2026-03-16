"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChevronRight, Inbox, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

interface HistoryItem {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  created_at: string;
}

interface GenerationHistoryProps {
  table: string;
  titleField: string;
  subtitleField?: string;
  statusField?: string;
  filters?: Record<string, string | string[]>;
  emptyMessage: string;
  onSelect?: (item: HistoryItem) => void;
  className?: string;
}

export function GenerationHistory({
  table,
  titleField,
  subtitleField,
  statusField,
  filters,
  emptyMessage,
  onSelect,
  className,
}: GenerationHistoryProps) {
  const { user } = useUser();
  const [items, setItems] = React.useState<HistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
    null,
  );
  const supabase = createClient();

  React.useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const fields = [
          "id",
          titleField,
          subtitleField,
          statusField,
          "created_at",
        ]
          .filter(Boolean)
          .join(", ");

        let query = supabase.from(table).select(fields).eq("user_id", user.id);
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else {
              query = query.eq(key, value);
            }
          });
        }
        const { data, error } = await query
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) {
          console.error("GenerationHistory: fetch error", error);
          setItems([]);
        } else if (data) {
          setItems(
            (data as unknown as Record<string, unknown>[]).map((row) => ({
              id: row.id as string,
              title: (row[titleField] as string) || "Sans titre",
              subtitle: subtitleField
                ? (row[subtitleField] as string) || undefined
                : undefined,
              status: statusField
                ? (row[statusField] as string) || undefined
                : undefined,
              created_at: row.created_at as string,
            })),
          );
        }
      } catch (err) {
        console.error("GenerationHistory: unexpected error", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, table, titleField, subtitleField, statusField, filters, supabase]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Élément supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const statusVariant = (status?: string) => {
    switch (status) {
      case "active":
        return "cyan";
      case "validated":
        return "default";
      case "draft":
        return "muted";
      case "published":
        return "cyan";
      case "paused":
        return "muted";
      default:
        return "muted";
    }
  };

  const statusLabel = (status?: string) => {
    switch (status) {
      case "active":
        return "Actif";
      case "validated":
        return "Validé";
      case "draft":
        return "Brouillon";
      case "published":
        return "Publié";
      case "paused":
        return "En pause";
      default:
        return status || "";
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border-default bg-bg-secondary p-4 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-bg-tertiary rounded-md" />
                <div className="h-3 w-1/2 bg-bg-tertiary rounded-md" />
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-3 w-3 bg-bg-tertiary rounded-full" />
                  <div className="h-3 w-24 bg-bg-tertiary rounded-md" />
                </div>
              </div>
              <div className="h-5 w-16 bg-bg-tertiary rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center py-12",
          className,
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 mb-4">
          <Inbox className="h-7 w-7 text-accent" />
        </div>
        <p className="text-sm font-medium text-text-primary mb-1">
          Aucun historique
        </p>
        <p className="text-sm text-text-muted max-w-xs">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-text-muted">
          {items.length} élément{items.length > 1 ? "s" : ""}
        </p>
      </div>
      {items.map((item) => (
        <Card
          key={item.id}
          className={cn(
            "transition-all group",
            onSelect && "cursor-pointer hover:border-border-hover",
          )}
          onClick={() => {
            if (confirmDeleteId === item.id) return;
            onSelect?.(item);
          }}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="text-xs text-text-muted mt-0.5 truncate">
                    {item.subtitle}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <Clock className="h-3 w-3 text-text-muted" />
                  <span className="text-xs text-text-muted">
                    {format(new Date(item.created_at), "d MMM yyyy à HH:mm", {
                      locale: fr,
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {item.status && (
                  <Badge variant={statusVariant(item.status)}>
                    {statusLabel(item.status)}
                  </Badge>
                )}

                {/* Delete button */}
                {confirmDeleteId === item.id ? (
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:text-danger text-xs h-7 px-2"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                    >
                      {deletingId === item.id ? "..." : "Supprimer"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-text-muted text-xs h-7 px-2"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 text-text-muted hover:text-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(item.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}

                {onSelect && confirmDeleteId !== item.id && (
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
