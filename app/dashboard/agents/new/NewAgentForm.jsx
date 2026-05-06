"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/hooks/use-lang";

export default function NewAgentForm({ username }) {
  const { t } = useLang("agentsNew");
  const [handle, setHandle] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const address = handle
    ? `${handle}.${username}@air7.fun`
    : `agentname.${username}@air7.fun`;

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle }),
    });

    const json = await res.json();

    if (!json.success) {
      setStatus("idle");
      setError(json.error);
      return;
    }

    setRevealed(json.data.apiKey);
    setStatus("done");
  }

  function copyField(value, field) {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  if (status === "done") {
    const doneAddress = `${handle}.${username}@air7.fun`;
    const doneHandle = `${handle}.${username}`;
    const credentials = [
      { label: t.doneAddress, value: doneAddress, field: "address" },
      { label: t.doneApiKey, value: revealed, field: "apikey", note: t.doneApiKeyNote },
    ];
    return (
      <main className="form-page">
        <div className="form-shell">
          <h1>{t.doneTitle}</h1>
          <p className="form-subtitle">{t.doneSubtitle}</p>

          <div className="cred-list">
            {credentials.map(({ label, value, field, note }) => (
              <div key={field} className="cred-row">
                <div className="cred-label">{label}</div>
                <div className="cred-value-row">
                  <code className="cred-value">{value}</code>
                  <button
                    className="button small cred-copy-btn"
                    onClick={() => copyField(value, field)}
                  >
                    {copiedField === field ? t.copied : t.copy}
                  </button>
                </div>
                {note && <div className="cred-note">{note}</div>}
              </div>
            ))}
          </div>

          <p className="form-footer" style={{ marginTop: 24 }}>
            <Link href="/dashboard">{t.backToDashboard}</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="form-page">
      <div className="form-shell">
        <Link className="back-link" href="/dashboard">{t.back}</Link>
        <h1>{t.title}</h1>
        <p className="form-subtitle">
          {t.subtitle?.replace("{preview}", "")}
          <strong>{address}</strong>
        </p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            {t.handleLabel}
            <input
              required
              type="text"
              placeholder={t.handlePlaceholder}
              value={handle}
              onChange={(e) =>
                setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              autoFocus
              minLength={3}
              maxLength={30}
            />
            {handle && (
              <small style={{ color: "var(--muted)", marginTop: 4, display: "block" }}>
                {address}
              </small>
            )}
          </label>

          {error && <p className="error-msg">{error}</p>}

          <button
            className="button primary"
            type="submit"
            disabled={status === "loading"}
          >
            {status === "loading" ? t.submitLoading : t.submit}
          </button>
        </form>
      </div>
    </main>
  );
}
