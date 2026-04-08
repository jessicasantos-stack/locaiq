"use client";
import { C } from "../constants/colors";

export default function Rec({ type, text }) {
  const m = { ok: [C.green, "✓"], warn: [C.yellow, "⚠"], error: [C.red, "✗"], tip: [C.accent, "💡"] };
  const [color, icon] = m[type] || [C.muted, "ℹ"];
  return (<div style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}><span style={{ color, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{icon}</span><span style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{text}</span></div>);
}
