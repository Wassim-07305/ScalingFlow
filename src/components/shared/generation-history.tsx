"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronRight, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";

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
  filters?: Record<string, string>;
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
  const supabase = createClient();

  React.useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
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
          query = query.eq(key, value);
        });
      }
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setItems(
          (data as any[]).map((row) => ({
            id: row.id as string,
            title: (row[titleField] as string) || "Sans titre",
            subtitle: subtitleField
              ? (row[subtitleField] as string) || undefined
              : undefined,
            status: statusField
              ? (row[statusField] as string) || undefined
              : undefined,
            created_at: row.created_at as string,
          }))
        );
      }
      setLoading(false);
    };

    fetchHistory();
  }, [user, table, titleField, subtitleField, statusField, filters, supabase]);

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
            className="h-20 rounded-xl bg-bg-tertiary animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Inbox className="h-12 w-12 text-text-muted mx-auto mb-3" />
        <p className="text-text-secondary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <Card
          key={item.id}
          className={cn(
            "transition-all",
            onSelect && "cursor-pointer hover:border-border-hover"
          )}
          onClick={() => onSelect?.(item)}
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
                {onSelect && (
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
