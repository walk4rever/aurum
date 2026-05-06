"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { copy } from "@/lib/i18n";

const LANG_KEY = "aurum.lang";
const LANG_EVENT = "aurum:lang-change";

function resolveLang() {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(LANG_KEY);
  const cookieLang = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${LANG_KEY}=`))
    ?.split("=")[1];
  const system = navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
  return (stored || cookieLang || system) === "zh" ? "zh" : "en";
}

export function useLang(page) {
  const router = useRouter();
  const [lang, setLangState] = useState(() => resolveLang());

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  // Sync across tabs
  useEffect(() => {
    function onStorage(e) {
      if (e.key === LANG_KEY && e.newValue) {
        setLangState(e.newValue === "zh" ? "zh" : "en");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Sync within the same tab
  useEffect(() => {
    function onLangChange(e) {
      const nextLang = e.detail === "zh" ? "zh" : "en";
      setLangState(nextLang);
    }
    window.addEventListener(LANG_EVENT, onLangChange);
    return () => window.removeEventListener(LANG_EVENT, onLangChange);
  }, []);

  const setLang = (l) => {
    const nextLang = l === "zh" ? "zh" : "en";
    localStorage.setItem(LANG_KEY, nextLang);
    document.cookie = `${LANG_KEY}=${nextLang};path=/;max-age=31536000`;
    setLangState(nextLang);
    window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: nextLang }));
    router.refresh();
  };

  const t = copy[lang]?.[page] ?? {};
  return { lang, setLang, t };
}
