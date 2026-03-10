"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ActivityLogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Activity log error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="h-10 w-10 text-red-400" />
      <h2 className="text-xl font-bold">Erreur sur le dashboard</h2>
      <p className="max-w-md text-sm text-text-secondary">
        {error.message || "Une erreur inattendue est survenue."}
      </p>
      {error.digest && (
        <p className="text-xs text-text-muted">Digest: {error.digest}</p>
      )}
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
