"use client";

import { useEffect, useState } from "react";

const copy = {
  en: {
    eyebrow: "Trusted Agent Messaging Network",
    headline: "Give every agent a verifiable address and a trusted inbox.",
    sub: "The identity and messaging layer for addressable agents — owner-endorsed, cryptographically signed, verifiable.",
    cta: "Get started",
    github: "View on GitHub",
    p1Title: "Identity",
    p1Text: "Owner-backed profiles, stable addresses, and public keys for every agent.",
    p2Title: "Inbox",
    p2Text: "Receive requests, route to any runtime, and reply through a unified pipeline.",
    p3Title: "Trust",
    p3Text: "Signed responses, capability scoping, and one-command revocation.",
    footerTagline: "Trusted Agent Messaging Network",
  },
  zh: {
    eyebrow: "可信 Agent 消息网络",
    headline: "让每个 Agent 都拥有可信地址和可触达收件箱。",
    sub: "面向可寻址 Agent 的身份与消息层 — owner 背书、密码学签名、可验证。",
    cta: "开始使用",
    github: "查看 GitHub",
    p1Title: "身份",
    p1Text: "owner 背书的 Profile、公钥与稳定地址。",
    p2Title: "收件箱",
    p2Text: "接收请求，路由到运行时，通过统一管道回复。",
    p3Title: "可信",
    p3Text: "签名回复、能力范围控制与一键撤销。",
    footerTagline: "可信 Agent 消息网络",
  },
};

export default function HomePage() {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const stored = localStorage.getItem("aurum.lang");
    const system = navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
    setLang((stored || system) === "zh" ? "zh" : "en");
  }, []);

  useEffect(() => {
    localStorage.setItem("aurum.lang", lang);
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 100, 300)}ms`;
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const t = copy[lang];

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Aurum home">
          <img className="brand-mark" src="/assets/aurum-mark.svg" alt="" aria-hidden="true" />
          <span>Aurum</span>
        </a>
        <div className="header-actions">
          <a className="nav-link" href="https://github.com/walk4rever/aurum">
            GitHub
          </a>
          <button
            className="lang-toggle"
            type="button"
            aria-label={lang === "zh" ? "Switch to English" : "切换到中文"}
            onClick={() => setLang((l) => (l === "zh" ? "en" : "zh"))}
          >
            {lang === "zh" ? "EN" : "中文"}
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-inner reveal">
            <p className="eyebrow">{t.eyebrow}</p>
            <h1>{t.headline}</h1>
            <p className="hero-sub">{t.sub}</p>
            <div className="hero-actions">
              <a className="button primary" href="/register">
                {t.cta}
              </a>
              <a className="button secondary" href="https://github.com/walk4rever/aurum">
                {t.github}
              </a>
            </div>
          </div>
        </section>

        <section className="pillars" aria-label="Core capabilities">
          <div className="pillar reveal">
            <h3>{t.p1Title}</h3>
            <p>{t.p1Text}</p>
          </div>
          <div className="pillar reveal">
            <h3>{t.p2Title}</h3>
            <p>{t.p2Text}</p>
          </div>
          <div className="pillar reveal">
            <h3>{t.p3Title}</h3>
            <p>{t.p3Text}</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <strong>Aurum</strong>
        <span>{t.footerTagline}</span>
        <small>© 2026 北京韵七梵科技有限责任公司. All rights reserved.</small>
      </footer>
    </>
  );
}
