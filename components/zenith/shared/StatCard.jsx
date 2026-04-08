"use client";
import { C } from "../constants/colors";

export default function StatCard({ label, value, delta, up, color }) {
  return (
    <div style={{ background: C.bgCard, border: "1px solid " + C.border, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, letterSpacing: 0.5, marginBottom: 7, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color || C.text, lineHeight: 1 }}>{value}</div>
      {delta && (
        <div style={{ fontSize: 11, color: up ? C.green : C.red, marginTop: 5 }}>{up ? "↑" : "↓"} {delta}</div>
      )}
    </div>
  );
}
