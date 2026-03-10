"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { triggerAchievement } from "@/stores/achievement-store";
import type { AchievementData } from "@/components/gamification/achievement-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  body: string | null;
  created_at: string;
}

/**
 * Hook qui ecoute les nouvelles notifications et declenche
 * les toasts d'achievement pour les badges, level ups, etc.
 */
export function useAchievementListener() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    // Ecouter les nouvelles notifications en temps reel
    const channel = supabase
      .channel("achievement-listener")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as Notification;

          // Transformer la notification en achievement si c'est un type supporte
          if (
            notification.type === "badge" ||
            notification.type === "level_up" ||
            notification.type === "milestone"
          ) {
            const achievement: AchievementData = {
              id: notification.id,
              type: notification.type as "badge" | "level_up" | "milestone",
              title: notification.title,
              description: notification.message || notification.body || "",
              xp: extractXP(notification.message || notification.body || ""),
            };

            triggerAchievement(achievement);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
}

/**
 * Extrait le montant XP d'un message si present
 * Ex: "+100 XP" -> 100
 */
function extractXP(message: string): number | undefined {
  const match = message.match(/\+?(\d+)\s*XP/i);
  return match ? parseInt(match[1], 10) : undefined;
}
