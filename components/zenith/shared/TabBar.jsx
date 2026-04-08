"use client";
import { C } from "../constants/colors";

export default function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", borderBottom: "1px solid " + C.border, marginBottom: 20, gap: 0 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: "8px 16px", border: "none", borderBottom: active === t.id ? "2px solid " + C.blue : "2px solid transparent",
          background: "transparent", color: active === t.id ? C.blue : C.textMuted,
          fontWeight: active === t.id ? 600 : 400, fontSize: 13, cursor: "pointer",
          whiteSpace: "nowrap", transition: "color 0.12s", marginBottom: -1,
        }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
