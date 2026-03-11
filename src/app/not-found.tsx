import Link from "next/link";

export default function NotFound() {
  return (
    <div
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
        <p
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#34D399",
            marginBottom: 8,
            lineHeight: 1,
          }}
        >
          404
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          Page introuvable
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#9CA3AF",
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          La page que tu cherches n&apos;existe pas ou a ete deplacee.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link
            href="/"
            style={{
              padding: "10px 24px",
              backgroundColor: "#34D399",
              color: "#0B0E11",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Retour au dashboard
          </Link>
          <Link
            href="/welcome"
            style={{
              padding: "10px 24px",
              backgroundColor: "#1C1F23",
              color: "#E5E7EB",
              border: "1px solid #2A2D31",
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Page d&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
