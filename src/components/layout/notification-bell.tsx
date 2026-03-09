"use client";

import React from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-default">
          <span className="text-sm font-semibold text-text-primary">
            Notifications
          </span>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Tout lire
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="h-8 w-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary">
              Aucune notification
            </p>
          </div>
        ) : (
          <div className="py-1">
            {notifications.slice(0, 20).map((n) => (
              <button
                key={n.id}
                onClick={() => !n.read && markAsRead(n.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 hover:bg-bg-tertiary transition-colors",
                  !n.read && "bg-accent/5"
                )}
              >
                <div className="flex items-start gap-2">
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                  )}
                  {n.read && (
                    <Check className="mt-1 h-3 w-3 text-text-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {n.title}
                    </p>
                    <p className="text-xs text-text-secondary line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {format(new Date(n.created_at), "d MMM à HH:mm", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
