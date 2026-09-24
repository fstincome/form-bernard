import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { QuestionStats } from "@/components/QuestionStats";

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
              <QuestionStats rows={rows.map((r) => r.answers)} />
            ) : (
              <ul className="space-y-2">
                {rows.map((r, i) => (
                  <li key={r.id} className="rounded-xl border border-border bg-card">
                    <button onClick={() => setOpen(open === r.id ? null : r.id)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                      <span className="font-medium text-foreground">Réponse n° {rows.length - i}</span>
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
