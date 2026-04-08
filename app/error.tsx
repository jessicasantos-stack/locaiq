"use client";

export default function Error({
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
        <div style={{ fontSize: 48, marginBottom: 16 }}>Something went wrong</div>
        <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 24, lineHeight: 1.6 }}>
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          style={{
            padding: "10px 24px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
