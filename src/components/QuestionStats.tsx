import { surveySections, type QDef } from "@/lib/questions";

type Answers = Record<string, unknown>;

function Bars({ items, total }: { items: { label: string; n: number }[]; total: number }) {
  const max = Math.max(1, ...items.map((i) => i.n));
  return (
    <ul className="space-y-2">
      {items.map((it) => {
        const pct = total ? Math.round((it.n / total) * 100) : 0;
        return (
          <li key={it.label} className="grid grid-cols-[minmax(0,14rem)_1fr_5.5rem] items-center gap-3 text-sm max-sm:grid-cols-[1fr_4.5rem]">
            <span className="truncate text-foreground max-sm:col-span-2" title={it.label}>{it.label}</span>
            <div className="h-5 overflow-hidden rounded bg-muted">
              <div className="h-full rounded bg-primary transition-all" style={{ width: `${(it.n / max) * 100}%` }} />
            </div>
            <span className="text-right tabular-nums text-muted-foreground"><b className="text-foreground">{it.n}</b> · {pct}%</span>
          </li>
        );
      })}
    </ul>
  );
}

const scaleLabels = ["1 Fort. désaccord", "2 Désaccord", "3 Neutre", "4 D’accord", "5 Fort. d’accord"];
const scaleShades = ["bg-destructive/80", "bg-destructive/45", "bg-muted-foreground/40", "bg-primary/60", "bg-primary"];

function ScaleBlock({ q, rows }: { q: Extract<QDef, { kind: "scale" }>; rows: Answers[] }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {scaleLabels.map((l, i) => <span key={l} className="flex items-center gap-1"><i className={`inline-block h-3 w-3 rounded-sm ${scaleShades[i]}`} />{l}</span>)}
      </div>
      {q.statements.map((s, idx) => {
        const vals = rows.map((r) => Number(r[`${q.prefix}_${idx}`])).filter((v) => v >= 1 && v <= 5);
        const counts = [1, 2, 3, 4, 5].map((k) => vals.filter((v) => v === k).length);
        const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        const agree = vals.length ? Math.round(((counts[3] + counts[4]) / vals.length) * 100) : 0;
        return (
          <div key={idx} className="rounded-lg border border-border/60 p-3">
            <p className="text-sm text-foreground">{idx + 1}. {s}</p>
            <div className="mt-2 flex h-6 overflow-hidden rounded bg-muted">
              {counts.map((c, i) => c > 0 && (
                <div key={i} className={`${scaleShades[i]} flex items-center justify-center text-[11px] font-semibold text-primary-foreground`} style={{ width: `${(c / vals.length) * 100}%` }} title={`${scaleLabels[i]} : ${c}`}>{c}</div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Moyenne <b className="text-foreground">{mean.toFixed(2)}</b> / 5 · D’accord (4–5) <b className="text-foreground">{agree}%</b> · {vals.length} réponse(s)
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function QuestionStats({ rows }: { rows: Answers[] }) {
  let n = 0;
  return (
    <div className="space-y-10">
      {surveySections.map((sec) => (
        <section key={sec.title}>
          <h2 className="mb-4 font-serif text-2xl text-foreground">{sec.title}</h2>
          <div className="space-y-4">
            {sec.questions.map((q) => {
              n++;
              let body: React.ReactNode;
              let answered = rows.length;
              if (q.kind === "scale") {
                body = <ScaleBlock q={q} rows={rows} />;
              } else {
                const answeredRows = rows.filter((r) => { const v = r[q.key]; return Array.isArray(v) ? v.length > 0 : v != null && v !== ""; });
                answered = answeredRows.length;
                const count = (o: string) => answeredRows.filter((r) => { const v = r[q.key]; return Array.isArray(v) ? v.includes(o) : v === o; }).length;
                const items = q.options.map((o) => ({ label: o, n: count(o) }));
                const others = q.otherKey ? rows.map((r) => r[q.otherKey!]).filter((v): v is string => typeof v === "string" && v.trim() !== "") : [];
                body = (
                  <>
                    <Bars items={items} total={answered} />
                    {others.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Précisions « Autre » : {others.join(" · ")}</p>}
                  </>
                );
              }
              return (
                <article key={n} className="rounded-xl border border-border bg-card p-5">
                  <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-medium text-foreground">Q{n}. {q.title}</h3>
                    <span className="text-xs text-muted-foreground">{q.kind === "multi" ? `${answered} répondant(s) · % par répondant` : `${answered} répondant(s)`}</span>
                  </header>
                  {body}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
