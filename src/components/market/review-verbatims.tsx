"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  Star,
  ChevronDown,
  ChevronUp,
  MessageSquareQuote,
  ThumbsUp,
  ThumbsDown,
  Minus,
  MapPin,
  Shield,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReviewVerbatim {
  source: "google_maps" | "trustpilot";
  name: string;
  text: string;
  rating: number;
  date: string;
  sentiment: "positif" | "négatif" | "neutre";
}

export interface ReviewSourceData {
  source: string;
  count: number;
  averageRating: number;
}

interface ReviewVerbatimsProps {
  verbatims: ReviewVerbatim[];
  reviewsData: ReviewSourceData[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < Math.round(rating)
              ? "text-yellow-400 fill-yellow-400"
              : "text-text-muted",
          )}
        />
      ))}
    </div>
  );
}

const SENTIMENT_CONFIG = {
  positif: {
    icon: ThumbsUp,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    label: "Positif",
  },
  négatif: {
    icon: ThumbsDown,
    color: "text-red-400",
    bg: "bg-red-400/10",
    label: "Négatif",
  },
  neutre: {
    icon: Minus,
    color: "text-text-muted",
    bg: "bg-bg-tertiary",
    label: "Neutre",
  },
} as const;

const SOURCE_CONFIG = {
  google_maps: { icon: MapPin, label: "Google Maps", color: "text-blue-400" },
  trustpilot: { icon: Shield, label: "Trustpilot", color: "text-green-400" },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewVerbatims({
  verbatims,
  reviewsData,
}: ReviewVerbatimsProps) {
  const [activeSentiment, setActiveSentiment] = useState<
    "all" | "positif" | "négatif" | "neutre"
  >("all");
  const [expanded, setExpanded] = useState(false);

  if (!verbatims || verbatims.length === 0) return null;

  const filteredVerbatims =
    activeSentiment === "all"
      ? verbatims
      : verbatims.filter((v) => v.sentiment === activeSentiment);

  const sentimentCounts = {
    positif: verbatims.filter((v) => v.sentiment === "positif").length,
    négatif: verbatims.filter((v) => v.sentiment === "négatif").length,
    neutre: verbatims.filter((v) => v.sentiment === "neutre").length,
  };

  const displayedVerbatims = expanded
    ? filteredVerbatims
    : filteredVerbatims.slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total reviews */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <MessageSquareQuote className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {verbatims.length}
                </p>
                <p className="text-xs text-text-muted">Avis analysés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Per-source stats */}
        {reviewsData.map((rd) => {
          const srcKey = rd.source as keyof typeof SOURCE_CONFIG;
          const srcConfig = SOURCE_CONFIG[srcKey] || {
            icon: Star,
            label: rd.source,
            color: "text-text-muted",
          };
          const SrcIcon = srcConfig.icon;

          return (
            <Card key={rd.source}>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-bg-tertiary flex items-center justify-center">
                    <SrcIcon className={cn("h-5 w-5", srcConfig.color)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-text-primary">
                        {rd.count}
                      </p>
                      <StarRating rating={rd.averageRating} />
                    </div>
                    <p className="text-xs text-text-muted">
                      {srcConfig.label} — {rd.averageRating}/5 moy.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Sentiment breakdown */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {sentimentCounts.positif}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Minus className="h-3.5 w-3.5" />
                  {sentimentCounts.neutre}
                </span>
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <ThumbsDown className="h-3.5 w-3.5" />
                  {sentimentCounts.négatif}
                </span>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Répartition sentiments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment filter */}
      <div className="flex gap-2">
        {(["all", "positif", "négatif", "neutre"] as const).map((key) => {
          const isActive = activeSentiment === key;
          const label =
            key === "all"
              ? `Tous (${verbatims.length})`
              : `${SENTIMENT_CONFIG[key].label} (${sentimentCounts[key]})`;

          return (
            <button
              key={key}
              onClick={() => setActiveSentiment(key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                isActive
                  ? "bg-accent/10 border-accent text-accent"
                  : "bg-bg-tertiary border-border-default text-text-secondary hover:border-border-hover",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Verbatims grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayedVerbatims.map((v, idx) => {
          const sentConfig = SENTIMENT_CONFIG[v.sentiment];
          const SentIcon = sentConfig.icon;
          const srcKey = v.source as keyof typeof SOURCE_CONFIG;
          const srcConfig = SOURCE_CONFIG[srcKey] || {
            icon: Star,
            label: v.source,
            color: "text-text-muted",
          };

          return (
            <Card
              key={idx}
              className={cn(
                "border-l-2",
                sentConfig.color.replace("text-", "border-"),
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SentIcon className={cn("h-4 w-4", sentConfig.color)} />
                    <span className="text-sm font-medium text-text-primary">
                      {v.name || "Anonyme"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="default"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {srcConfig.label}
                    </Badge>
                    <StarRating rating={v.rating} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-text-secondary leading-relaxed">
                  {v.text.length > 250 ? v.text.slice(0, 250) + "..." : v.text}
                </p>
                {v.date && (
                  <p className="text-[10px] text-text-muted mt-2">{v.date}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Show more/less */}
      {filteredVerbatims.length > 6 && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-text-secondary hover:text-text-primary"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Voir moins
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Voir les {filteredVerbatims.length - 6} avis restants
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
