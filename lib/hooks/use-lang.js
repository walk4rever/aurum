"use client";

import { useState, useEffect } from "react";
import { copy } from "@/lib/i18n";

function resolveLang() {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem("aurum.lang");
  const system = navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
  return (stored || system) === "zh" ? "zh" : "en";
}

export function useLang(page) {
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    const l = resolveLang();
    setLangState(l);
    document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
  }, []);

  const setLang = (l) => {
    localStorage.setItem("aurum.lang", l);
    document.cookie = `aurum.lang=${l};path=/;max-age=31536000`;
    document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
    setLangState(l);
    window.location.reload();
  };

  const t = copy[lang]?.[page] ?? {};
  return { lang, setLang, t };
}
