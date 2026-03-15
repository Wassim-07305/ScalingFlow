"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Calendar, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ClientRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: "prospect" | "actif" | "inactif" | "churne";
  notes: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  total_deals_amount?: number;
  deals_count?: number;
  last_activity?: string | null;
}

const STATUS_CONFIG: Record<
  ClientRow["status"],
  { label: string; variant: "default" | "blue" | "muted" | "red" | "yellow"; color: string; bgColor: string }
> = {
  prospect: { label: "Prospect", variant: "blue", color: "text-blue-400", bgColor: "bg-blue-500/15" },
  actif: { label: "Actif", variant: "default", color: "text-emerald-400", bgColor: "bg-emerald-500/15" },
  inactif: { label: "Inactif", variant: "muted", color: "text-text-muted", bgColor: "bg-bg-tertiary" },
  churne: { label: "Churné", variant: "red", color: "text-red-400", bgColor: "bg-red-500/15" },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days}j`;
  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
}

interface ClientCardProps {
  client: ClientRow;
  onClick: () => void;
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  const statusCfg = STATUS_CONFIG[client.status];

  return (
    <div
      className={cn(
        "cursor-pointer group rounded-2xl border border-border-default bg-bg-secondary/50 p-4",
        "transition-all duration-300 ease-out backdrop-blur-sm",
        "hover:border-accent/30 hover:bg-bg-secondary hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-1 hover:scale-[1.01]",
        "animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-11 w-11 ring-1 ring-border-default group-hover:ring-accent/30 transition-all duration-300 group-hover:shadow-md group-hover:shadow-accent/10">
          {client.avatar_url && <AvatarImage src={client.avatar_url} alt={client.name} />}
          <AvatarFallback className="bg-accent/10 text-accent text-sm font-semibold">
            {getInitials(client.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors duration-200">
              {client.name}
            </h3>
            <span className={cn(
              "inline-flex items-center gap-1.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all duration-200 group-hover:shadow-sm",
              statusCfg.bgColor, statusCfg.color
            )}>
              <span className={cn(
                "h-1.5 w-1.5 rounded-full",
                statusCfg.color === "text-text-muted" ? "bg-text-muted" : "bg-current",
                client.status === "actif" && "animate-pulse"
              )} />
              {statusCfg.label}
            </span>
          </div>

          {client.company && (
            <p className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
              <Building2 className="h-3 w-3" />
              {client.company}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border-default/50 group-hover:border-accent/10 transition-colors duration-200">
            {typeof client.total_deals_amount === "number" && (
              <span className="flex items-center gap-1 text-xs text-text-secondary">
                <DollarSign className="h-3 w-3 text-accent" />
                <span className="font-medium">{formatCurrency(client.total_deals_amount)}</span>
              </span>
            )}
            {typeof client.deals_count === "number" && client.deals_count > 0 && (
              <span className="text-xs text-text-muted">
                {client.deals_count} deal{client.deals_count > 1 ? "s" : ""}
              </span>
            )}
            {client.last_activity && (
              <span className="flex items-center gap-1 text-xs text-text-muted ml-auto">
                <Calendar className="h-3 w-3" />
                {timeAgo(client.last_activity)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
