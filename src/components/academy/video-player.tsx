"use client";

import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";

interface VideoPlayerProps {
  videoUrl?: string;
  title?: string;
  className?: string;
}

export function VideoPlayer({ videoUrl, title, className }: VideoPlayerProps) {
  const isLoom = videoUrl?.includes("loom.com");

  const embedUrl = isLoom ? videoUrl?.replace("share/", "embed/") : videoUrl;

  return (
    <Card className={cn(className)}>
      <CardContent className="p-0">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-bg-tertiary">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={title || "Video"}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="autoplay; fullscreen"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-text-muted text-sm">Aucune video disponible</p>
            </div>
          )}
        </div>
        {title && (
          <div className="p-4">
            <h3 className="font-medium text-text-primary">{title}</h3>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
