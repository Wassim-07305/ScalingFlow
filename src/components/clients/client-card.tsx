"use client";

import { Card } from "@/components/ui/card";
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
  { label: string; variant: "default" | "blue" | "muted" | "red" | "yellow" }
> = {
  prospect: { label: "Prospect", variant: "blue" },
  actif: { label: "Actif", variant: "default" },
  inactif: { label: "Inactif", variant: "muted" },
  churne: { label: "Churné", variant: "red" },
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
    <Card
      className={cn(
        "cursor-pointer group hover:border-accent/40 transition-all duration-200"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-11 w-11">
          {client.avatar_url && <AvatarImage src={client.avatar_url} alt={client.name} />}
          <AvatarFallback className="bg-accent-muted text-accent text-sm font-semibold">
            {getInitials(client.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
              {client.name}
            </h3>
            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
          </div>

          {client.company && (
            <p className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
              <Building2 className="h-3 w-3" />
              {client.company}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3">
            {typeof client.total_deals_amount === "number" && (
              <span className="flex items-center gap-1 text-xs text-text-secondary">
                <DollarSign className="h-3 w-3 text-accent" />
                {formatCurrency(client.total_deals_amount)}
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
    </Card>
  );
}
