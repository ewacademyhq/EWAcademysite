"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROLE_HOME, type Rol } from "@/lib/role-home";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("rol")
      .eq("id", data.user.id)
      .maybeSingle();

    const next = searchParams.get("next");
    const rol = profile?.rol as Rol | undefined;
    const destino = next || (rol ? ROLE_HOME[rol] : "/");

    router.replace(destino);
    router.refresh();
  }

  const inputClass =
    "h-12 w-full border border-[var(--line2)] bg-[var(--surface)] px-4 text-[15px] text-[var(--text)] placeholder:text-[var(--faint)]";

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-[400px] flex-col gap-5">
      <div>
        <label className="text-[11px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
          Email
        </label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputClass} mt-2`}
          placeholder="vos@ejemplo.com"
        />
      </div>

      <div>
        <label className="text-[11px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
          Contraseña
        </label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${inputClass} mt-2`}
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="border-l-[3px] border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 h-12 bg-[var(--accent)] text-[13px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-600)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
