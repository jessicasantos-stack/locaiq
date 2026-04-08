"use client";

export default function Tag({ color, children }) {
  return <span style={{ background: color + "22", color, borderRadius: 6, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{children}</span>;
}
