"use client";

import { useEffect } from "react";
import { useLang } from "@/lib/hooks/use-lang";
import LangToggle from "@/components/LangToggle";

export default function HomePage() {
  const { lang, t } = useLang("home");

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
          <LangToggle className="lang-toggle" />
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
        <small>
          {lang === "zh"
            ? "© 2026 北京韵七梵科技有限责任公司. All rights reserved."
            : "© 2026 Beijing Yunqifan Technology Co., Ltd. All rights reserved."}
        </small>
      </footer>
    </>
  );
}
