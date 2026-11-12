"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const MENSAJE_GENERICO = "Si existe una cuenta con ese email, te mandamos un link para crear una contraseña nueva.";

export function RecuperarContrasenaForm() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);

    const supabase = createClient();
    // No se distingue el resultado al usuario (exista o no esa cuenta) para
    // no dejar que este formulario sirva para averiguar qué emails están
    // registrados.
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/activar-cuenta`,
    });

    setEnviando(false);
    setEnviado(true);
  }

  const inputClass =
    "h-12 w-full border border-[var(--line2)] bg-[var(--surface)] px-4 text-[15px] text-[var(--text)] placeholder:text-[var(--faint)]";

  if (enviado) {
    return (
      <div className="flex w-full max-w-[400px] flex-col gap-5">
        <p className="border-l-[3px] border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-[13.5px] leading-[1.5] text-[var(--text)]">
          {MENSAJE_GENERICO}
        </p>
        <Link
          href="/login"
          className="text-[12px] font-medium uppercase tracking-[.06em] text-[var(--faint)] hover:text-[var(--accent)] hover:underline"
        >
          Volver a ingresar
        </Link>
      </div>
    );
  }

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

      <button
        type="submit"
        disabled={enviando}
        className="mt-2 h-12 bg-[var(--accent)] text-[13px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-600)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {enviando ? "Enviando…" : "Mandarme el link"}
      </button>

      <Link
        href="/login"
        className="text-[12px] font-medium uppercase tracking-[.06em] text-[var(--faint)] hover:text-[var(--accent)] hover:underline"
      >
        Volver a ingresar
      </Link>
    </form>
  );
}
