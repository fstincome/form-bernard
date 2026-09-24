import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { QuestionStats } from "@/components/QuestionStats";
import { surveySections, type QDef } from "@/lib/questions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Réponses COMESA" },
      { name: "description", content: "Suivi des réponses reçues au questionnaire COMESA." },
      { property: "og:title", content: "Tableau de bord — Réponses COMESA" },
      { property: "og:description", content: "Suivi des réponses reçues." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Row = { id: string; created_at: string; answers: Record<string, unknown> };

const fmt = (d: string) => new Date(d).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
const val = (v: unknown) => (Array.isArray(v) ? v.join(", ") : v == null ? "" : String(v));

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const [tab, setTab] = useState<"stats" | "list">("stats");
  const [period, setPeriod] = useState<"all" | "today" | "7d" | "30d">("all");
  const [filterQ, setFilterQ] = useState("");
  const [filterA, setFilterA] = useState("");

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user!.id).eq("role", "admin");
      return (data?.length ?? 0) > 0;
    },
  });

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ["responses"],
    enabled: isAdmin === true,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.from("questionnaire_responses").select("id, created_at, answers").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Row[];
    },
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function exportCsv() {
    const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r.answers))));
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const lines = [["date", ...keys].map(esc).join(","), ...rows.map((r) => [fmt(r.created_at), ...keys.map((k) => val(r.answers[k]))].map(esc).join(","))];
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "reponses-comesa.csv";
    a.click();
  }

  const filterableQs: { label: string; def: Extract<QDef, { kind: "choice" | "multi" }> }[] = surveySections.flatMap((s) =>
    s.questions.filter((q): q is Extract<QDef, { kind: "choice" | "multi" }> => q.kind !== "scale").map((q) => ({ label: `${s.title.split(".")[0]}. ${q.title}`, def: q })),
  );
  const selectedQ = filterableQs.find((q) => q.def.key === filterQ);

  const periodStart = period === "all" ? null : period === "today" ? new Date(new Date().setHours(0, 0, 0, 0)) : new Date(Date.now() - (period === "7d" ? 7 : 30) * 864e5);
  const filtered = rows.filter((r) => {
    if (periodStart && new Date(r.created_at) < periodStart) return false;
    if (selectedQ && filterA) {
      const v = r.answers[selectedQ.def.key];
      return Array.isArray(v) ? v.includes(filterA) : v === filterA;
    }
    return true;
  });
  const hasFilters = period !== "all" || (filterQ !== "" && filterA !== "");

  const today = rows.filter((r) => new Date(r.created_at).toDateString() === new Date().toDateString()).length;
  const week = rows.filter((r) => Date.now() - new Date(r.created_at).getTime() < 7 * 864e5).length;

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo de l'étude" className="h-12 w-12 object-contain" width={1024} height={1024} />
            <div>
            <h1 className="font-serif text-3xl text-foreground">Réponses reçues</h1>
            <p className="text-sm text-muted-foreground">Questionnaire COMESA — mise à jour automatique</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => refetch()} className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted">Actualiser</button>
            <button onClick={exportCsv} disabled={!rows.length} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Exporter (CSV)</button>
            <button onClick={signOut} className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted">Déconnexion</button>
          </div>
        </header>

        {isAdmin === false ? (
          <p className="text-destructive">Ce compte n'a pas accès aux réponses.</p>
        ) : (
          <>
            <section className="mb-8 grid grid-cols-3 gap-4">
              {[["Total", rows.length], ["Aujourd'hui", today], ["7 derniers jours", week]].map(([l, n]) => (
                <div key={l} className="rounded-xl border border-border bg-card p-5">
                  <p className="text-sm text-muted-foreground">{l}</p>
                  <p className="mt-1 font-serif text-3xl text-primary">{n}</p>
                </div>
              ))}
            </section>

            <section className="mb-6 rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Période</span>
                  <select value={period} onChange={(e) => setPeriod(e.target.value as typeof period)} className="rounded-md border border-border bg-background px-3 py-2 text-foreground">
                    <option value="all">Toutes les dates</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="7d">7 derniers jours</option>
                    <option value="30d">30 derniers jours</option>
                  </select>
                </label>
                <label className="min-w-56 flex-1 text-sm">
                  <span className="mb-1 block text-muted-foreground">Question</span>
                  <select value={filterQ} onChange={(e) => { setFilterQ(e.target.value); setFilterA(""); }} className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground">
                    <option value="">Toutes les questions</option>
                    {filterableQs.map((q) => <option key={q.def.key} value={q.def.key}>{q.label}</option>)}
                  </select>
                </label>
                <label className="min-w-56 flex-1 text-sm">
                  <span className="mb-1 block text-muted-foreground">Réponse</span>
                  <select value={filterA} onChange={(e) => setFilterA(e.target.value)} disabled={!selectedQ} className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50">
                    <option value="">Toutes les réponses</option>
                    {selectedQ?.def.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
                {hasFilters && (
                  <button onClick={() => { setPeriod("all"); setFilterQ(""); setFilterA(""); }} className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted">
                    Réinitialiser
                  </button>
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                <b className="text-foreground">{filtered.length}</b> réponse(s) sur {rows.length} correspondant aux filtres.
              </p>
            </section>

            <div className="mb-6 inline-flex rounded-lg border border-border bg-card p-1">
              {([["stats", "Analyse par question"], ["list", "Réponses individuelles"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} className={`rounded-md px-4 py-2 text-sm ${tab === k ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}>{l}</button>
              ))}
            </div>

            {isLoading ? (
              <p className="text-muted-foreground">Chargement…</p>
            ) : rows.length === 0 ? (
              <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Aucune réponse pour le moment.</p>
            ) : tab === "stats" ? (
              <QuestionStats rows={filtered.map((r) => r.answers)} />
            ) : filtered.length === 0 ? (
              <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Aucune réponse ne correspond aux filtres.</p>
            ) : (
              <ul className="space-y-2">
                {filtered.map((r, i) => (
                  <li key={r.id} className="rounded-xl border border-border bg-card">
                    <button onClick={() => setOpen(open === r.id ? null : r.id)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                      <span className="font-medium text-foreground">Réponse n° {filtered.length - i}</span>
                      <span className="text-sm text-muted-foreground">
                        {val(r.answers["sexe"])} · {val(r.answers["occupation"])} · {fmt(r.created_at)}
                      </span>
                    </button>
                    {open === r.id && (
                      <dl className="grid gap-x-6 gap-y-2 border-t border-border px-5 py-4 text-sm sm:grid-cols-2">
                        {Object.entries(r.answers).map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-4 border-b border-border/50 py-1">
                            <dt className="text-muted-foreground">{k}</dt>
                            <dd className="text-right text-foreground">{val(v)}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  );
}
