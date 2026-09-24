import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion admin — Questionnaire COMESA" },
      { name: "description", content: "Espace réservé au chercheur pour suivre les réponses." },
      { property: "og:title", content: "Connexion admin — Questionnaire COMESA" },
      { property: "og:description", content: "Espace réservé au chercheur." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError("Email ou mot de passe incorrect.");
    navigate({ to: "/admin" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div>
          <img src={logo} alt="Logo de l'étude" className="mb-4 h-16 w-16 object-contain" width={1024} height={1024} />
          <h1 className="font-serif text-2xl text-foreground">Espace administrateur</h1>
          <p className="mt-1 text-sm text-muted-foreground">Suivi des réponses au questionnaire</p>
        </div>
        <label className="block text-sm font-medium text-foreground">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Mot de passe
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button disabled={loading} className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
