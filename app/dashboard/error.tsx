"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0f1e",
      fontFamily: "'Space Grotesk', system-ui",
      color: "#e2e8f0",
    }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Dashboard Error</div>
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24, lineHeight: 1.6 }}>
          {error.message || "Failed to load dashboard. Please try again."}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
          <button
            onClick={() => window.location.href = "/agency"}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "transparent",
              color: "#94a3b8",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Back to Agency
          </button>
        </div>
      </div>
    </div>
  );
}
