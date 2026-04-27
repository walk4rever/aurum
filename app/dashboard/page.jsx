import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n/server";
import { copy } from "@/lib/i18n";
import { signOut } from "./actions";
import LangToggle from "@/components/LangToggle";

export default async function DashboardPage() {
  const lang = await getLang();
  const t = copy[lang]?.dashboard ?? {};

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("aurum_profiles")
    .select("display_name, type")
    .eq("id", user.id)
    .single();

  const { data: agents } = await supabase
    .from("aurum_agents")
    .select("id, handle, status, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  const activeAgents = (agents ?? []).filter((a) => a.status === "active");
  const canCreate = activeAgents.length < 3;

  return (
    <main className="dashboard-root">
      <header className="dash-header">
        <a href="/">
          <img src="/assets/aurum-mark.svg" alt="Aurum" width={36} height={36} />
        </a>
        <span className="dash-user">
          {profile?.display_name || user.email}
          <span className="dash-badge">{profile?.type}</span>
        </span>
        <div className="dash-header-actions">
          <LangToggle className="lang-toggle small" />
          <form action={signOut}>
            <button type="submit" className="button ghost small">{t.signOut}</button>
          </form>
        </div>
      </header>

      <section className="dash-body">
        <div className="dash-section-head">
          <h2>{t.agentsTitle}</h2>
          {canCreate && (
            <a href="/dashboard/agents/new" className="button primary small">{t.newAgent}</a>
          )}
        </div>

        {activeAgents.length === 0 ? (
          <p className="dash-empty">{t.empty}</p>
        ) : (
          <ul className="agent-list">
            {activeAgents.map((agent) => (
              <li key={agent.id} className="agent-row">
                <span className="agent-handle">{agent.handle}<span className="agent-domain">@air7.fun</span></span>
                <span className="agent-created">{new Date(agent.created_at).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US")}</span>
              </li>
            ))}
          </ul>
        )}

        {!canCreate && (
          <p className="dash-limit-note">{t.limitNote}</p>
        )}
      </section>
    </main>
  );
}
