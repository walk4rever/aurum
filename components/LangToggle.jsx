"use client";

import { useLang } from "@/lib/hooks/use-lang";

export default function LangToggle({ className }) {
  const { lang, setLang } = useLang();
  return (
    <button
      className={className}
      type="button"
      aria-label={lang === "zh" ? "Switch to English" : "切换到中文"}
      onClick={() => setLang(lang === "zh" ? "en" : "zh")}
    >
      {lang === "zh" ? "EN" : "中文"}
    </button>
  );
}
