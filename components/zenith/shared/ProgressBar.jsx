"use client";
import { C } from "../constants/colors";

export default function ProgressBar({ value, color }) {
  const col = color || (value > 75 ? C.green : value > 50 ? C.yellow : C.red);
  return (
    <div style={{ height: 4, background: C.border + "88", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: Math.min(100, value || 0) + "%", borderRadius: 2, background: col, transition: "width 0.5s ease" }} />
    </div>
  );
}
