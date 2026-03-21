"use client";

import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";

interface VideoPlayerProps {
  videoUrl?: string;
  title?: string;
  className?: string;
}

function getLoomEmbedUrl(url: string): string {
  const match = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (!match) return url;
  return `https://www.loom.com/embed/${match[1]}?hide_owner=true&hide_share=true&hide_title=true`;
}

function getYouTubeEmbedUrl(url: string): string | null {
  // Supports:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID (already embed)
  // https://www.youtube.com/shorts/VIDEO_ID
  let videoId: string | null = null;

  const longMatch = url.match(
    /(?:youtube\.com\/(?:watch\?.*v=|shorts\/))([a-zA-Z0-9_-]{11})/,
  );
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);

  if (embedMatch) return url;
  if (longMatch) videoId = longMatch[1];
  else if (shortMatch) videoId = shortMatch[1];

  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

export function VideoPlayer({ videoUrl, title, className }: VideoPlayerProps) {
  const isLoom = videoUrl?.includes("loom.com");
  const isYouTube =
    videoUrl?.includes("youtube.com") || videoUrl?.includes("youtu.be");

  let embedUrl = videoUrl;
  if (isYouTube && videoUrl) {
    embedUrl = getYouTubeEmbedUrl(videoUrl) ?? videoUrl;
  } else if (isLoom && videoUrl) {
    embedUrl = getLoomEmbedUrl(videoUrl);
  }

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
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
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
