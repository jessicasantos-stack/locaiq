"use client";
import { useState } from "react";
import { C } from "../constants/colors";

export default function RefreshBtn({ onClick }) {
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState(false);
  const handle = () => { setSpinning(true); setDone(false); setTimeout(() => { if(onClick) onClick(); setSpinning(false); setDone(true); setTimeout(() => setDone(false), 1500); }, 800); };
  return (<button onClick={handle} style={{ background: done ? `${C.green}15` : C.subtle, border: `1px solid ${done ? C.green : C.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 11, color: done ? C.green : C.cyan, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 5, transition: "all 0.3s" }}><span style={{ display: "inline-block", transition: "transform 0.8s", transform: spinning ? "rotate(360deg)" : "rotate(0)" }}>{done ? "✓" : "🔄"}</span>{done ? "Updated" : "Refresh"}</button>);
}
