"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { T } from "../constants/translations";

const STORAGE_KEY = "zenith_lang";
const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLangRaw] = useState("en");

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && T[saved]) setLangRaw(saved);
    } catch {}
  }, []);

  const setLang = useCallback((l) => {
    setLangRaw(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  const t = T[lang] || T.en;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
