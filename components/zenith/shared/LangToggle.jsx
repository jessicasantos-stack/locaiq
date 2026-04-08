"use client";
import { C } from "../constants/colors";
import { useLang } from "../contexts/LangContext";

export default function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(l => l === "en" ? "pt" : "en")}
      style={{
        background: "transparent",
        border: "1px solid " + C.border,
        borderRadius: 6,
        color: C.textDim,
        fontSize: 11,
        fontWeight: 600,
        padding: "4px 10px",
        cursor: "pointer",
        letterSpacing: 0.5,
        transition: "border-color 0.15s, color 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.color = C.blue; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim; }}
    >
      {lang === "en" ? "PT" : "EN"}
    </button>
  );
}
