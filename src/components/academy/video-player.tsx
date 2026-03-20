"use client";

import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";

interface VideoPlayerProps {
  videoUrl?: string;
  title?: string;
  className?: string;
}

function getLoomEmbedUrl(url: string): string {
  // Extract the video ID from various Loom URL formats:
  // https://www.loom.com/share/abc123
  // https://www.loom.com/share/abc123?sid=xyz
  // https://loom.com/share/abc123
  const match = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (!match) return url;
  return `https://www.loom.com/embed/${match[1]}?hide_owner=true&hide_share=true&hide_title=true`;
}

export function VideoPlayer({ videoUrl, title, className }: VideoPlayerProps) {
  const isLoom = videoUrl?.includes("loom.com");

  const embedUrl = isLoom && videoUrl ? getLoomEmbedUrl(videoUrl) : videoUrl;

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
