"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-primary p-4 text-center">
      <div className="rounded-full bg-red-500/10 p-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-text-primary">
          Une erreur est survenue
        </h2>
        <p className="max-w-md text-sm text-text-secondary">
          {error.message ||
            "Une erreur inattendue s'est produite. Veuillez réessayer."}
        </p>
        {error.digest && (
          <p className="text-xs text-text-muted">Ref: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </button>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-secondary"
        >
          <Home className="h-4 w-4" />
          Accueil
        </a>
      </div>
    </div>
  );
}
