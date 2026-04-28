import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n/server";
import { copy } from "@/lib/i18n";
import { signOut } from "./actions";

function AgentsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="3"/>
      <path d="M8 21h8M12 17v4"/>
    </svg>
  );
}

export default async function DashboardPage() {
  const lang = await getLang();
  const t = copy[lang]?.dashboard ?? {};

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("aurum_profiles").upsert(
    { id: user.id, type: "individual", display_name: user.email?.split("@")[0] ?? "" },
    { onConflict: "id", ignoreDuplicates: true }
  );

  const { data: profile } = await supabase
    .from("aurum_profiles")
    .select("display_name, type, username")
    .eq("id", user.id)
    .single();

  const { data: agents } = await supabase
    .from("aurum_agents")
    .select("id, handle, status, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  const activeAgents = (agents ?? []).filter((a) => a.status === "active");
  const canCreate = activeAgents.length < 3;

  const displayName = profile?.username
    ? `@${profile.username}`
    : (profile?.display_name || user.email);

  const avatarLetter = (profile?.username || profile?.display_name || user.email || "?")[0].toUpperCase();

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-inner">
          <Link href="/" className="dash-logo">
            <Image src="/assets/aurum-mark.svg" alt="Aurum" width={26} height={26} />
            <span>Aurum</span>
          </Link>

          <div className="dash-identity">
            <div className="dash-avatar">{avatarLetter}</div>
            <div className="dash-identity-info">
              <div className="dash-identity-name">{displayName}</div>
              <div className="dash-identity-type">{profile?.type ?? "individual"}</div>
            </div>
          </div>

          <nav className="dash-nav">
            <span className="dash-nav-label">Workspace</span>
            <Link href="/dashboard" className="dash-nav-item dash-nav-active">
              <AgentsIcon />
              {t.agentsTitle}
            </Link>
          </nav>

          <div className="dash-sidebar-footer">
            <Link href="/dashboard/settings" className="dash-footer-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              {t.settings}
            </Link>
            <form action={signOut} style={{ margin: 0 }}>
              <button type="submit" className="dash-footer-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                {t.signOut}
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="dash-main">
        {!profile?.username && (
          <div className="dash-setup-bar">
            <div className="dash-setup-bar-inner">
              <span className="dash-setup-star">✦</span>
              <span>{t.usernameBanner}</span>
              <Link href="/dashboard/settings?setup=username" className="button primary small">
                {t.usernameBannerCta}
              </Link>
            </div>
          </div>
        )}

        <div className="dash-content">
          <div className="dash-content-header">
            <h1 className="dash-content-title">{t.agentsTitle}</h1>
            {canCreate && profile?.username && (
              <Link href="/dashboard/agents/new" className="button primary small">{t.newAgent}</Link>
            )}
          </div>

          {activeAgents.length === 0 ? (
            <div className="dash-empty-state">
              <p className="dash-empty-text">{t.empty}</p>
              {profile?.username && canCreate && (
                <Link href="/dashboard/agents/new" className="button primary">{t.newAgent}</Link>
              )}
            </div>
          ) : (
            <div className="agent-grid">
              {activeAgents.map((agent) => {
                const address = profile?.username
                  ? `${agent.handle}.${profile.username}@air7.fun`
                  : `${agent.handle}@air7.fun`;
                return (
                  <div key={agent.id} className="agent-card">
                    <div className="agent-card-top">
                      <span className="agent-card-name">{agent.handle}</span>
                      <span className="agent-card-status">
                        <span className="agent-status-dot" />
                        active
                      </span>
                    </div>
                    <div className="agent-card-address">{address}</div>
                    <div className="agent-card-meta">
                      {new Date(agent.created_at).toLocaleDateString(
                        lang === "zh" ? "zh-CN" : "en-US",
                        { year: "numeric", month: "long", day: "numeric" }
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!canCreate && (
            <p className="dash-limit-note" style={{ marginTop: 20 }}>{t.limitNote}</p>
          )}
        </div>
      </main>
    </div>
  );
}
