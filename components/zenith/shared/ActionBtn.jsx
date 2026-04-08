"use client";
import { useState } from "react";
import { C } from "../constants/colors";

export default function ActionBtn({ label, color = C.blue, onClick, icon = "→" }) {
  const [done, setDone] = useState(false);
  const handle = () => { if (onClick) onClick(); setDone(true); setTimeout(() => setDone(false), 2000); };
  return (
    <button onClick={handle} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, border: `1px solid ${color}44`, background: `${color}15`, color, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
      {done ? "✓ Copied!" : `${icon} ${label}`}
    </button>
  );
}
