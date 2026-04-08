"use client";
import { C } from "../constants/colors";

export default function Badge({ label, color }) {
  return (
    <span style={{ padding: "2px 7px", borderRadius: 4, background: (color || C.blue) + "18", color: color || C.blue, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap", letterSpacing: 0.2, display: "inline-block" }}>
      {label}
    </span>
  );
}
