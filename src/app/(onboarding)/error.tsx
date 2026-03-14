"use client";

import { useEffect } from "react";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Onboarding error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-primary text-center text-text-primary">
      <h2 className="text-xl font-bold">Erreur pendant l&apos;onboarding</h2>
      <p className="max-w-md text-sm text-text-secondary">
        {error.message || "Une erreur inattendue est survenue."}
      </p>
      {error.digest && (
        <p className="text-xs text-text-muted">Digest: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-6 py-2.5 font-semibold text-bg-primary"
        >
          Reessayer
        </button>
        <a
          href="/"
          className="rounded-lg border border-border-default px-6 py-2.5 font-semibold text-text-primary"
        >
          Retour a l&apos;accueil
        </a>
      </div>
    </div>
  );
}
