"use client";

import { useState, useEffect } from "react";
import { copy } from "@/lib/i18n";

const LANG_KEY = "aurum.lang";

function resolveLang() {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(LANG_KEY);
  const system = navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
  return (stored || system) === "zh" ? "zh" : "en";
}

export function useLang(page) {
  const [lang, setLangState] = useState(() => resolveLang());

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  // Sync across components when another instance calls setLang
  useEffect(() => {
    function onStorage(e) {
      if (e.key === LANG_KEY && e.newValue) {
        setLangState(e.newValue === "zh" ? "zh" : "en");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLang = (l) => {
    localStorage.setItem(LANG_KEY, l);
    document.cookie = `${LANG_KEY}=${l};path=/;max-age=31536000`;
    setLangState(l);
    // Dispatch storage event so other mounted components (e.g. homepage) update instantly
    window.dispatchEvent(new StorageEvent("storage", { key: LANG_KEY, newValue: l }));
  };

  const t = copy[lang]?.[page] ?? {};
  return { lang, setLang, t };
}
