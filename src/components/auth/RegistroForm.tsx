"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calcularEdad } from "@/lib/date";
import { VERSION_DOCUMENTOS_LEGALES } from "@/lib/legal";
import { passwordValida, PASSWORD_REQUISITOS_MSG } from "@/lib/password";
import { ROLE_HOME } from "@/lib/role-home";
import { HCaptcha, type HCaptchaHandle } from "@/components/auth/HCaptcha";

export function RegistroForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captchaRef = useRef<HCaptchaHandle>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !email.trim()) {
      setError("Completá tu nombre y tu email.");
      return;
    }
    if (!passwordValida(password)) {
      setError(PASSWORD_REQUISITOS_MSG);
      return;
    }
    if (!fechaNacimiento) {
      setError("Completá tu fecha de nacimiento.");
      return;
    }
    if (calcularEdad(fechaNacimiento) < 18) {
      setError("Tenés que ser mayor de 18 años para registrarte.");
      return;
    }
    if (!acceptedTerms) {
      setError("Tenés que aceptar los Términos y Condiciones y la Política de Privacidad.");
      return;
    }
    if (!captchaToken) {
      setError("Completá la verificación antes de crear tu cuenta.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { nombre: nombre.trim(), fecha_nacimiento: fechaNacimiento },
        captchaToken,
      },
    });

    captchaRef.current?.reset();
    setCaptchaToken("");

    if (signUpError || !data.user) {
      setLoading(false);
      setError(
        signUpError?.message.toLowerCase().includes("already registered")
          ? "Ese email ya tiene una cuenta en EW Academy. Iniciá sesión en vez de registrarte."
          : `No pudimos crear tu cuenta: ${signUpError?.message ?? "error desconocido"}`
      );
      return;
    }

    const { error: consentError } = await supabase.from("aceptaciones_legales").insert({
      user_id: data.user.id,
      version: VERSION_DOCUMENTOS_LEGALES,
    });

    if (consentError) {
      setLoading(false);
      setError(`No se pudo registrar la aceptación de los términos: ${consentError.message}`);
      return;
    }

    // No bloqueante (EWA-040): si falla, la cuenta ya quedó creada — solo se
    // pierde el mail de verificación de esta vez.
    fetch("/api/auth/enviar-verificacion-email", { method: "POST" }).catch(() => {});

    router.replace(ROLE_HOME.alumno);
    router.refresh();
  }

  const inputClass =
    "h-12 w-full border border-[var(--line2)] bg-[var(--surface)] px-4 text-[15px] text-[var(--text)] placeholder:text-[var(--faint)]";
  const labelClass = "text-[11px] font-medium uppercase tracking-[.14em] text-[var(--faint)]";

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-[400px] flex-col gap-5">
      <div>
        <label className={labelClass}>Nombre y apellido</label>
        <input
          type="text"
          required
          autoComplete="name"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={`${inputClass} mt-2`}
          placeholder="Tu nombre completo"
        />
      </div>

      <div>
        <label className={labelClass}>Email</label>
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
        <label className={labelClass}>Contraseña</label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${inputClass} mt-2`}
          placeholder="Mín. 8, con mayúscula, minúscula y carácter especial"
        />
        <p className="mt-1.5 text-[12px] leading-[1.5] text-[var(--faint)]">{PASSWORD_REQUISITOS_MSG}</p>
      </div>

      <div>
        <label className={labelClass}>Fecha de nacimiento</label>
        <input
          type="date"
          required
          value={fechaNacimiento}
          onChange={(e) => setFechaNacimiento(e.target.value)}
          className={`${inputClass} mt-2`}
        />
        <p className="mt-1.5 text-[12px] leading-[1.5] text-[var(--faint)]">
          Academia EW es solo para mayores de 18 años — la usamos para verificarlo.
        </p>
      </div>

      <HCaptcha ref={captchaRef} onVerify={setCaptchaToken} />

      <label className="flex items-start gap-2.5 text-[13px] leading-[1.5] text-[var(--dim)]">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[var(--accent)]"
        />
        <span>
          Acepto los{" "}
          <a href="/terminos" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
            Términos y Condiciones
          </a>{" "}
          y la{" "}
          <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
            Política de Privacidad
          </a>
          .
        </span>
      </label>

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
        {loading ? "Creando tu cuenta…" : "Crear mi cuenta"}
      </button>

      <p className="text-center text-[12.5px] text-[var(--faint)]">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-[var(--accent)] hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </form>
  );
}
