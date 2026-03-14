"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("GlobalError boundary caught:", error);
  }, [error]);

  return (
    <html lang="fr" className="dark">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0B0E11",
          color: "#E5E7EB",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 480, padding: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            Quelque chose s&apos;est mal passe
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#9CA3AF",
              marginBottom: 8,
              lineHeight: 1.5,
            }}
          >
            {error.message || "Erreur inconnue"}
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 24 }}>
              Digest: {error.digest}
            </p>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                padding: "10px 24px",
                backgroundColor: "#34D399",
                color: "#0B0E11",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Reessayer
            </button>
            <button
              onClick={() => {
                if ("caches" in window) {
                  caches.keys().then((names) => {
                    names.forEach((name) => caches.delete(name));
                  });
                }
                if ("serviceWorker" in navigator) {
                  navigator.serviceWorker
                    .getRegistrations()
                    .then((registrations) => {
                      registrations.forEach((r) => r.unregister());
                    });
                }
                window.location.reload();
              }}
              style={{
                padding: "10px 24px",
                backgroundColor: "#1C1F23",
                color: "#E5E7EB",
                border: "1px solid #2A2D31",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Vider le cache
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
