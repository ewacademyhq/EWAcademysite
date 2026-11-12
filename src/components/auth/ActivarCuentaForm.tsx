"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROLE_HOME, type Rol } from "@/lib/role-home";

type Status = "cargando" | "listo" | "error";
type HashResult =
  | { kind: "error"; message: string }
  | { kind: "tokens"; access_token: string; refresh_token: string };

const GENERIC_ERROR = "No encontramos una invitación válida. Pedile a administración que te reenvíe el link.";

/**
 * El link de invitación/recuperación de Supabase llega con el token en el
 * hash de la URL (#access_token=... o #error=...), no como query — no lo ve
 * el servidor, solo se puede leer en el cliente.
 */
function parseHash(): HashResult {
  if (typeof window === "undefined") return { kind: "error", message: GENERIC_ERROR };

  const params = new URLSearchParams(window.location.hash.slice(1));

  if (params.has("error")) {
    const code = params.get("error_code");
    const message =
      code === "otp_expired"
        ? "Este link venció o ya se usó — a veces el escaneo automático de seguridad de Gmail lo gasta antes de que lo abras vos. Pedile a administración que te reenvíe la invitación."
        : (params.get("error_description")?.replace(/\+/g, " ") ?? GENERIC_ERROR);
    return { kind: "error", message };
  }

  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) return { kind: "error", message: GENERIC_ERROR };

  return { kind: "tokens", access_token, refresh_token };
}

export function ActivarCuentaForm() {
  const router = useRouter();
  const [hash] = useState(parseHash);
  const [status, setStatus] = useState<Status>(hash.kind === "error" ? "error" : "cargando");
  const [errorMsg, setErrorMsg] = useState(hash.kind === "error" ? hash.message : "");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (hash.kind === "error") return;

    // El cliente de Supabase que usa este proyecto (@supabase/ssr, pensado
    // para el flujo PKCE con cookies) no detecta solo el access_token que
    // viene en el hash de un link de invitación — hay que setear la sesión
    // a mano con lo que ya se leyó del hash en el estado inicial.
    const supabase = createClient();
    supabase.auth.setSession(hash).then(({ data, error }) => {
      if (error || !data.session) {
        setErrorMsg(GENERIC_ERROR);
        setStatus("error");
      } else {
        setStatus("listo");
      }
    });
  }, [hash]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (password.length < 6) {
      setFormError("La contraseña necesita al menos 6 caracteres.");
      return;
    }
    if (password !== password2) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }

    setGuardando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setGuardando(false);
      setFormError(error.message);
      return;
    }

    // Llegar hasta acá ya prueba que el email es real (vino de un link que
    // solo pudo abrir quien tiene esa casilla) — se marca verificado directo,
    // sin pasar por el flujo de token de EWA-040.
    await supabase.rpc("mark_my_email_verificado");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("users")
      .select("rol")
      .eq("id", user?.id ?? "")
      .maybeSingle();
    const rol = (profile?.rol as Rol | undefined) ?? "alumno";

    router.replace(ROLE_HOME[rol]);
    router.refresh();
  }

  const inputClass =
    "h-12 w-full border border-[var(--line2)] bg-[var(--surface)] px-4 text-[15px] text-[var(--text)] placeholder:text-[var(--faint)]";

  if (status === "cargando") {
    return <p className="text-[13.5px] text-[var(--dim)]">Validando invitación…</p>;
  }

  if (status === "error") {
    return (
      <p className="max-w-[360px] border-l-[3px] border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-[13.5px] leading-[1.5] text-[var(--danger)]">
        {errorMsg}
      </p>
    );
  }

  return (
    <form onSubmit={guardar} className="flex w-full max-w-[400px] flex-col gap-5">
      <div>
        <label className="text-[11px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
          Contraseña nueva
        </label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${inputClass} mt-2`}
          placeholder="••••••••"
        />
      </div>

      <div>
        <label className="text-[11px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
          Repetí la contraseña
        </label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          className={`${inputClass} mt-2`}
          placeholder="••••••••"
        />
      </div>

      {formError && (
        <p className="border-l-[3px] border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-[13px] text-[var(--danger)]">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="mt-2 h-12 bg-[var(--accent)] text-[13px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-600)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {guardando ? "Guardando…" : "Crear contraseña y entrar"}
      </button>
    </form>
  );
}
