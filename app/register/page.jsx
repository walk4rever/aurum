"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/hooks/use-lang";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function RegisterPage() {
  const { t } = useLang("register");
  const [type, setType] = useState("individual");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleGoogleSignIn() {
    setStatus("google");
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    if (authError) {
      setStatus("idle");
      setError(authError.message);
    }
  }

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: { type, display_name: form.name },
      },
    });

    if (authError) {
      setStatus("idle");
      setError(authError.message);
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <main className="form-page">
        <div className="form-shell">
          <div className="verify-msg">
            <h1>{t.verifyTitle}</h1>
            <p dangerouslySetInnerHTML={{ __html: t.verifyText?.replace("{email}", `<strong>${form.email}</strong>`) }} />
            <p>{t.verifyAction}</p>
            <p className="form-footer">
              {t.verifyWrong} <Link href="/register">{t.verifyStartOver}</Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="form-page">
      <div className="form-shell">
        <Link className="back-link" href="/">{t.back}</Link>
        <h1>{t.title}</h1>
        <p className="form-subtitle" dangerouslySetInnerHTML={{ __html: t.subtitle?.replace("{site}", "<strong>air7.fun</strong>") }} />

        <div className="form-grid" style={{ marginTop: "24px" }}>
          <button
            className="button google-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={status === "loading" || status === "google"}
          >
            <GoogleIcon />
            {t.googleSignIn}
          </button>

          <div className="or-divider"><span>{t.orDivider}</span></div>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="type-selector">
            <label className={`type-option${type === "individual" ? " selected" : ""}`}>
              <input
                type="radio"
                name="type"
                value="individual"
                checked={type === "individual"}
                onChange={() => setType("individual")}
              />
              <span className="type-label">{t.typeIndividual}</span>
              <span className="type-desc">{t.typeIndividualDesc}</span>
            </label>
            <label className={`type-option${type === "organization" ? " selected" : ""}`}>
              <input
                type="radio"
                name="type"
                value="organization"
                checked={type === "organization"}
                onChange={() => setType("organization")}
              />
              <span className="type-label">{t.typeOrganization}</span>
              <span className="type-desc">{t.typeOrganizationDesc}</span>
            </label>
          </div>

          <label>
            {type === "individual" ? t.nameLabelIndividual : t.nameLabelOrganization}
            <input
              required
              type="text"
              placeholder={type === "individual" ? t.namePlaceholderIndividual : t.namePlaceholderOrganization}
              value={form.name}
              onChange={update("name")}
            />
          </label>
          <label>
            {t.emailLabel}
            <input
              required
              type="email"
              placeholder={t.emailPlaceholder}
              value={form.email}
              onChange={update("email")}
            />
          </label>
          <label>
            {t.passwordLabel}
            <input
              required
              type="password"
              placeholder={t.passwordPlaceholder}
              minLength={8}
              value={form.password}
              onChange={update("password")}
            />
          </label>

          {error && <p className="error-msg">{error}</p>}

          <button className="button primary" type="submit" disabled={status === "loading"}>
            {status === "loading" ? t.submitLoading : t.submit}
          </button>
        </form>

        <p className="form-footer">
          {t.footer} <Link href="/login">{t.footerLink}</Link>
        </p>
      </div>
    </main>
  );
}
