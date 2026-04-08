"use client";
import { C } from "../constants/colors";

export default function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: -0.2 }}>{children}</div>
      {sub && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}
