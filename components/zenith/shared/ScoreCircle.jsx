"use client";
import { C } from "../constants/colors";

export default function ScoreCircle({ score, size = 100 }) {
  const color = score > 75 ? C.green : score > 50 ? C.yellow : C.red;
  const r = 40;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", width: size, height: size }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke={C.border} strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.22, fontWeight: 800, color }}>
        {score}
      </div>
    </div>
  );
}
