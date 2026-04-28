"use client";

import { useState } from "react";
import { useLang } from "@/lib/hooks/use-lang";

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

export default function SettingsForm({ profile, setupUsername }) {
  const { t } = useLang("settings");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [selectedLang, setSelectedLang] = useState(profile?.lang ?? "en");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    setSaved(false);

    const updates = {};
    if (username !== (profile?.username ?? "")) updates.username = username;
    if (selectedLang !== (profile?.lang ?? "en")) updates.lang = selectedLang;

    if (Object.keys(updates).length === 0) {
      setStatus("idle");
      setSaved(true);
      return;
    }

    const res = await fetch("/api/profiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const json = await res.json();

    if (!json.success) {
      setError(json.error);
      setStatus("idle");
      return;
    }

    if ("lang" in updates) {
      window.location.reload();
      return;
    }

    setSaved(true);
    setStatus("idle");
  }

  return (
    <div className="settings-layout">
      <div className="settings-sidebar">
        <a href="/dashboard" className="settings-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          {t.back}
        </a>
        <h1 className="settings-title">{t.title}</h1>
        <nav className="settings-nav">
          <a href="#profile" className="settings-nav-item settings-nav-active">
            <UserIcon /> {t.usernameLabel}
          </a>
          <a href="#language" className="settings-nav-item">
            <GlobeIcon /> {t.langLabel}
          </a>
        </nav>
      </div>

      <div className="settings-main">
        {setupUsername && (
          <div className="settings-setup-notice">
            <strong>{t.usernameBannerTitle}</strong>
            <p>{t.usernameBannerText}</p>
          </div>
        )}

        <form onSubmit={handleSave}>
          <section className="settings-section" id="profile">
            <div className="settings-section-header">
              <div className="settings-section-icon"><UserIcon /></div>
              <div>
                <h2 className="settings-section-title">{t.usernameLabel}</h2>
                <p className="settings-section-desc">{t.usernameHint}</p>
              </div>
            </div>
            <div className="settings-field">
              <div className="settings-input-wrap">
                <span className="settings-input-prefix">@</span>
                <input
                  className="settings-input"
                  type="text"
                  placeholder={t.usernamePlaceholder}
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                  minLength={3}
                  maxLength={30}
                  autoFocus={setupUsername}
                />
              </div>
            </div>
          </section>

          <div className="settings-divider" />

          <section className="settings-section" id="language">
            <div className="settings-section-header">
              <div className="settings-section-icon"><GlobeIcon /></div>
              <div>
                <h2 className="settings-section-title">{t.langLabel}</h2>
              </div>
            </div>
            <div className="settings-field">
              <div className="settings-lang-options">
                {[
                  { value: "en", label: "English" },
                  { value: "zh", label: "中文" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`settings-lang-btn${selectedLang === value ? " settings-lang-selected" : ""}`}
                    onClick={() => setSelectedLang(value)}
                  >
                    {selectedLang === value && <CheckIcon />}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="settings-footer">
            {error && <p className="error-msg" style={{ margin: 0 }}>{error}</p>}
            {saved && !error && (
              <span className="settings-saved">
                <CheckIcon /> {t.saved}
              </span>
            )}
            <button
              className="button primary"
              type="submit"
              disabled={status === "loading"}
            >
              {status === "loading" ? t.saving : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
