"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

// ─── Unipile OAuth Callback Page ────────────────────────────
// Opens in popup — notifies opener window then auto-closes.

export default function UnipileCallbackPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("unipile"); // "success" | "error"
  const isSuccess = status === "success";

  useEffect(() => {
    // Notify the opener (settings page) that auth is done
    if (window.opener) {
      window.opener.postMessage(
        { type: "unipile-auth", status: isSuccess ? "success" : "error" },
        window.location.origin
      );
    }

    // Auto-close popup after a short delay
    const timer = setTimeout(() => {
      window.close();
    }, 1500);

    return () => clearTimeout(timer);
  }, [isSuccess]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="text-center space-y-4 p-8">
        {isSuccess ? (
          <>
            <CheckCircle2 className="h-12 w-12 text-accent mx-auto" />
            <h2 className="text-lg font-semibold text-text-primary">
              Compte connecté !
            </h2>
            <p className="text-sm text-text-muted">
              Cette fenêtre va se fermer automatiquement...
            </p>
          </>
        ) : status === "error" ? (
          <>
            <XCircle className="h-12 w-12 text-danger mx-auto" />
            <h2 className="text-lg font-semibold text-text-primary">
              Erreur de connexion
            </h2>
            <p className="text-sm text-text-muted">
              Ferme cette fenêtre et réessaie depuis les paramètres.
            </p>
          </>
        ) : (
          <>
            <Loader2 className="h-12 w-12 text-accent mx-auto animate-spin" />
            <p className="text-sm text-text-muted">Connexion en cours...</p>
          </>
        )}
      </div>
    </div>
  );
}
