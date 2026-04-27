"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/hooks/use-lang";

export default function RegisterPage() {
  const { t } = useLang("register");
  const [type, setType] = useState("individual");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

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

    if (data.user) {
      await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user.id,
          type,
          displayName: form.name || form.email.split("@")[0],
        }),
      });
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
              {t.verifyWrong} <a href="/register">{t.verifyStartOver}</a>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="form-page">
      <div className="form-shell">
        <a className="back-link" href="/">{t.back}</a>
        <h1>{t.title}</h1>
        <p className="form-subtitle" dangerouslySetInnerHTML={{ __html: t.subtitle?.replace("{site}", "<strong>air7.fun</strong>") }} />

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
          {t.footer} <a href="/login">{t.footerLink}</a>
        </p>
      </div>
    </main>
  );
}
