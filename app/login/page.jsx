"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/hooks/use-lang";

export default function LoginPage() {
  const { t } = useLang("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const router = useRouter();

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (authError) {
      setStatus("idle");
      setError(authError.message);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <main className="form-page">
      <div className="form-shell">
        <a className="back-link" href="/">{t.back}</a>
        <h1>{t.title}</h1>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            {t.emailLabel}
            <input
              required
              type="email"
              placeholder={t.emailPlaceholder}
              value={form.email}
              onChange={update("email")}
              autoFocus
            />
          </label>
          <label>
            {t.passwordLabel}
            <input
              required
              type="password"
              placeholder={t.passwordPlaceholder}
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
          {t.footer} <a href="/register">{t.footerLink}</a>
        </p>
      </div>
    </main>
  );
}
