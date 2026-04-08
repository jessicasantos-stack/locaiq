"use client";
import { C } from "../constants/colors";

export default function Btn({ children, onClick, disabled, variant = "primary", style = {} }) {
  const variants = {
    primary: { background: disabled ? C.border : "linear-gradient(135deg," + C.blue + "," + C.cyan + ")", color: "#fff", border: "none" },
    ghost: { background: "transparent", border: "1px solid " + C.border, color: C.textDim },
    danger: { background: C.red + "18", color: C.red, border: "1px solid " + C.red + "33" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "8px 18px", borderRadius: 7, fontWeight: 600, fontSize: 13,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
      transition: "opacity 0.15s", ...variants[variant], ...style
    }}>{children}</button>
  );
}
