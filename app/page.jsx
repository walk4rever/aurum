"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/hooks/use-lang";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const { lang, t } = useLang("home");
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });
  }, []);

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
          {loggedIn ? (
            <a className="button primary small" href="/dashboard">
              {lang === "zh" ? "控制台" : "Dashboard"}
            </a>
          ) : (
            <a className="button primary small" href="/login">
              {lang === "zh" ? "登录" : "Sign in"}
            </a>
          )}
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
        <div className="footer-social">
          <a href="https://github.com/walk4rever" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
          </a>
          <a href="https://x.com/RafaelZhu129" target="_blank" rel="noopener noreferrer" aria-label="X.com">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="mailto:walkklaw@gmail.com" aria-label="Email">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </a>
        </div>
        <small>
          {lang === "zh"
            ? "© 2026 北京韵七梵科技有限责任公司. All rights reserved."
            : "© 2026 Beijing Yunqifan Technology Co., Ltd. All rights reserved."}
        </small>
      </footer>
    </>
  );
}
