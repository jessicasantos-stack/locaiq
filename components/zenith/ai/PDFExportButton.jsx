"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import { generatePDFReport } from "../utils/pdf";

export default function PDFExportButton({ data, scores, semantic }) {
  const [status, setStatus] = useState("idle");
  const handleExport = () => {
    setStatus("generating");
    setTimeout(() => {
      const html = generatePDFReport(data, scores, semantic);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) setTimeout(() => win.print(), 800);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 3000);
    }, 800);
  };
  return (
    <button onClick={handleExport} disabled={status === "generating"} style={{
      background: status === "done" ? C.green : `linear-gradient(135deg, #dc2626, #f97316)`,
      color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px",
      fontSize: 13, fontWeight: 700, cursor: status === "generating" ? "wait" : "pointer",
      display: "flex", alignItems: "center", gap: 8, opacity: status === "generating" ? 0.7 : 1, transition: "all 0.3s", whiteSpace: "nowrap"
    }}>
      {status === "generating" ? "⏳ Generating..." : status === "done" ? "✅ Report opened!" : "📄 Export PDF"}
    </button>
  );
}
