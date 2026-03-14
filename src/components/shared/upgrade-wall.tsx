"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

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
            Tu as utilise{" "}
            <Badge variant="muted" className="mx-1">
              {currentUsage}/{limit}
            </Badge>{" "}
            générations IA ce mois-ci. Passe à Pro pour des générations illimitées.
          </p>
        </div>

        <Button asChild size="lg" className="gap-2">
          <Link href="/pricing">
            <Sparkles className="h-4 w-4" />
            Passer à Pro
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
