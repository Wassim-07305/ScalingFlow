"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

interface UpgradeWallProps {
  currentUsage: number;
  limit: number;
  className?: string;
}

export function UpgradeWall({ currentUsage, limit, className }: UpgradeWallProps) {
  return (
    <Card className={className}>
      <CardContent className="py-10 text-center space-y-4">
        <div className="flex items-center justify-center">
          <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Lock className="h-7 w-7 text-accent" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-text-primary">
            Limite atteinte
          </h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Tu as utilisé{" "}
            <Badge variant="muted" className="mx-1">
              {currentUsage}/{limit}
            </Badge>{" "}
            générations IA ce mois-ci. Ta limite mensuelle est atteinte, réessaie le mois prochain.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
