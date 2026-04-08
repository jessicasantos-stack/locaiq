"use client";
import { C } from "../constants/colors";

export default function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.bgCard, border: "1px solid " + C.border, borderRadius: 10, padding: "16px 18px", ...style }}>
      {children}
    </div>
  );
}
