"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Course } from "@/lib/types";
import type { CurrentUser } from "@/lib/auth";
import { formatARS } from "@/lib/format";
import { Toast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";

type PayMethod = "mp" | "manual";

export function CheckoutClient({
  course,
  user,
}: {
  course: Course;
  user: CurrentUser | null;
}) {
  const router = useRouter();
  const [account, setAccount] = useState<{ id: string; nombre: string; email: string } | null>(
    user ? { id: user.id, nombre: user.nombre, email: user.email } : null
  );
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const [pay, setPay] = useState<PayMethod>("mp");
  const [file, setFile] = useState<File | null>(null);
  const [paying, setPaying] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modalidadLabel = course.modalidad === "cohorte" ? "Cohorte" : "Autogestionado";
  const fechaLabel =
    course.fecha === "Inmediato" ? "ingreso inmediato" : `inicia ${course.fecha}`;

  const disabled = paying || confirmed || creatingAccount || (pay === "manual" && !file);

  async function handleConfirm() {
    if (disabled) return;
    setPayError(null);

    let currentAccount = account;

    if (!currentAccount) {
      if (!nombre.trim() || !email.trim() || password.length < 6) {
        setAccountError(
          "Completá tu nombre, email y una contraseña de al menos 6 caracteres."
        );
        return;
      }

      setCreatingAccount(true);
      setAccountError(null);

      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { nombre: nombre.trim() } },
      });

      setCreatingAccount(false);

      if (error || !data.user) {
        setAccountError(
          error?.message.toLowerCase().includes("already registered")
            ? "Ese email ya tiene una cuenta en EW Academy. Iniciá sesión y volvé a matricularte."
            : `No pudimos crear tu cuenta: ${error?.message ?? "error desconocido"}`
        );
        return;
      }

      currentAccount = { id: data.user.id, nombre: nombre.trim(), email: email.trim() };
      setAccount(currentAccount);
    }

    setPaying(true);

    if (pay === "manual") {
      await confirmManual(currentAccount.id);
    } else {
      await confirmMercadoPago();
    }
  }

  async function confirmManual(userId: string) {
    if (!file) return;
    const supabase = createClient();

    const path = `${userId}/${course.code}-${file.lastModified}-${file.size}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("comprobantes")
      .upload(path, file);

    if (uploadError) {
      setPaying(false);
      setPayError(`No se pudo subir el comprobante: ${uploadError.message}`);
      return;
    }

    const { data: existing } = await supabase
      .from("enrollments")
      .select("id, estado")
      .eq("user_id", userId)
      .eq("course_code", course.code)
      .maybeSingle();

    if (existing?.estado === "activa") {
      setPaying(false);
      setPayError("Ya tenés una matrícula activa en este curso.");
      return;
    }

    let enrollmentId = existing?.id as number | undefined;

    if (!enrollmentId) {
      const { data: created, error: enrollError } = await supabase
        .from("enrollments")
        .insert({
          user_id: userId,
          course_code: course.code,
          cuota_congelada: course.precio,
          estado: "pendiente",
          medio: "Transferencia",
        })
        .select("id")
        .single();

      if (enrollError || !created) {
        setPaying(false);
        setPayError(`No se pudo registrar la matrícula: ${enrollError?.message ?? "error desconocido"}`);
        return;
      }
      enrollmentId = created.id;
    }

    const { error: receiptError } = await supabase.from("receipts").insert({
      enrollment_id: enrollmentId,
      archivo_url: path,
      monto: course.precio,
      estado: "pendiente",
    });

    if (receiptError) {
      setPaying(false);
      setPayError(`No se pudo registrar el comprobante: ${receiptError.message}`);
      return;
    }

    finishSuccess("Comprobante enviado. Tu matrícula queda pendiente de aprobación.");
  }

  async function confirmMercadoPago() {
    try {
      const res = await fetch("/api/checkout/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseCode: course.code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPaying(false);
        setPayError(data.error ?? "No se pudo iniciar el pago.");
        return;
      }

      if (data.mode === "redirect") {
        // Navegación real a Mercado Pago — se va de la página a propósito.
        // eslint-disable-next-line react-hooks/immutability
        window.location.href = data.url;
        return;
      }

      if (data.mode === "already-active") {
        setPaying(false);
        setPayError("Ya tenés una matrícula activa en este curso.");
        return;
      }

      // data.mode === "simulated": sin credenciales de Mercado Pago todavía,
      // la matrícula ya quedó activada del lado del servidor.
      window.setTimeout(() => {
        finishSuccess("¡Matrícula confirmada! Ya tenés acceso a tu curso.");
      }, 900);
    } catch {
      setPaying(false);
      setPayError("No se pudo conectar con Mercado Pago. Probá de nuevo.");
    }
  }

  function finishSuccess(msg: string) {
    setPaying(false);
    setConfirmed(true);
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
    router.refresh();
  }

  const buttonLabel = creatingAccount
    ? "Creando tu cuenta…"
    : paying
    ? "Procesando…"
    : confirmed
      ? pay === "mp"
        ? "Matrícula activa"
        : "Comprobante enviado"
      : pay === "mp"
        ? "Pagar con Mercado Pago"
        : "Enviar comprobante";

  return (
    <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-8 px-8 py-10 lg:grid-cols-[1.3fr_.9fr] lg:items-start">
      <div>
        <h2
          className="font-bold uppercase text-[var(--text)]"
          style={{ fontFamily: "var(--font-humane)", fontSize: "66px", lineHeight: 0.84 }}
        >
          {course.titulo}
        </h2>
        <p className="mt-3 text-[13.5px] uppercase tracking-[.06em] text-[var(--dim)]">
          {course.vertical} · {modalidadLabel} · {fechaLabel}
        </p>

        <div className="mt-10 text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
          Tu cuenta
        </div>

        {account ? (
          <div className="mt-3 border border-[var(--line)] bg-[var(--surface)] px-5 py-4 text-[13.5px]">
            Vas a matricularte como{" "}
            <strong className="font-medium text-[var(--text)]">{account.nombre}</strong> ·{" "}
            {account.email}
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Nombre y apellido"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={confirmed}
              className="h-12 w-full border border-[var(--line2)] bg-[var(--surface)] px-4 text-[14.5px] placeholder:text-[var(--faint)]"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={confirmed}
                className="h-12 w-full border border-[var(--line2)] bg-[var(--surface)] px-4 text-[14.5px] placeholder:text-[var(--faint)]"
              />
              <input
                type="password"
                placeholder="Contraseña (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={confirmed}
                className="h-12 w-full border border-[var(--line2)] bg-[var(--surface)] px-4 text-[14.5px] placeholder:text-[var(--faint)]"
              />
            </div>
            <p className="text-[12px] leading-[1.5] text-[var(--faint)]">
              Con esto creamos tu cuenta de alumno. Si ya tenés una,{" "}
              <a href="/login" className="text-[var(--accent)] hover:underline">
                iniciá sesión
              </a>{" "}
              antes de matricularte.
            </p>
            {accountError && (
              <p className="border-l-[3px] border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-[13px] text-[var(--danger)]">
                {accountError}
              </p>
            )}
          </div>
        )}

        <div className="mt-10 text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
          Medio de pago
        </div>

        <div className="mt-3 flex flex-col gap-px bg-[var(--line)]">
          <button
            type="button"
            onClick={() => setPay("mp")}
            disabled={confirmed}
            className={`flex items-start gap-4 border-l-[3px] px-5 py-5 text-left transition-colors disabled:cursor-not-allowed ${
              pay === "mp"
                ? "border-l-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-l-transparent bg-[var(--surface)] hover:bg-[var(--surface2)]"
            }`}
          >
            <RadioSquare active={pay === "mp"} />
            <span className="flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-medium">Mercado Pago</span>
                <span className="bg-[var(--accent)] px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[.1em] text-[var(--accent-ink)]">
                  Recomendado
                </span>
              </span>
              <span className="mt-1 block text-[13.5px] leading-[1.5] text-[var(--dim)]">
                Débito automático mensual. Acceso inmediato y sin cortes por
                olvido.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPay("manual")}
            disabled={confirmed}
            className={`flex items-start gap-4 border-l-[3px] px-5 py-5 text-left transition-colors disabled:cursor-not-allowed ${
              pay === "manual"
                ? "border-l-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-l-transparent bg-[var(--surface)] hover:bg-[var(--surface2)]"
            }`}
          >
            <RadioSquare active={pay === "manual"} />
            <span className="flex-1">
              <span className="text-[15px] font-medium">
                Transferencia con comprobante
              </span>
              <span className="mt-1 block text-[13.5px] leading-[1.5] text-[var(--dim)]">
                Subís el comprobante y un administrador lo aprueba. Tu
                matrícula queda <em className="not-italic text-[var(--text)]">pendiente de aprobación</em>{" "}
                hasta entonces.
              </span>
            </span>
          </button>
        </div>

        {pay === "manual" && (
          <div style={{ animation: "slideUp .28s ease" }}>
            <div className="mt-4 flex items-center justify-between gap-4 border border-dashed border-[var(--line2)] px-5 py-5">
              <div>
                <div className="text-[13.5px] text-[var(--text)]">
                  {file ? file.name : "Ningún archivo seleccionado"}
                </div>
                <div className="mt-1 text-[11.5px] uppercase tracking-[.08em] text-[var(--faint)]">
                  PDF, JPG o PNG · hasta 5 MB
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                disabled={confirmed}
                onClick={() => fileInputRef.current?.click()}
                className="h-9 shrink-0 border border-[var(--line2)] px-4 text-[12px] font-medium uppercase tracking-[.06em] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed"
              >
                {file ? "Cambiar" : "Elegir archivo"}
              </button>
            </div>

            <div className="mt-4 border-l-[3px] border-[var(--accent)] bg-[var(--accent-soft)] px-5 py-4 text-[13.5px] leading-[1.5] text-[var(--dim)]">
              La aprobación puede demorar hasta 24 h hábiles. Vas a recibir un
              aviso y el acceso se abre solo.
            </div>
          </div>
        )}
      </div>

      <aside className="lg:sticky lg:top-24">
        <div className="border border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            Resumen
          </div>

          <div className="mt-4 flex flex-col gap-3 text-[14px]">
            <div className="flex items-center justify-between">
              <span className="text-[var(--dim)]">Mensualidad</span>
              <span>{formatARS(course.precio)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--dim)]">Matrícula</span>
              <span className="text-[var(--good)]">Sin cargo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--dim)]">Duración</span>
              <span>{course.duracion}</span>
            </div>
          </div>

          <div className="my-6 border-t-2 border-[var(--line)]" />

          <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            A pagar hoy
          </div>
          <div
            className="mt-2 font-bold text-[var(--text)]"
            style={{ fontFamily: "var(--font-humane)", fontSize: "52px", lineHeight: 0.8 }}
          >
            {formatARS(course.precio)}
          </div>

          <p className="mt-4 text-[13px] leading-[1.5] text-[var(--dim)]">
            Esta cuota queda{" "}
            <strong className="text-[var(--text)]">
              congelada en {formatARS(course.precio)}
            </strong>{" "}
            mientras tu matrícula siga activa, aunque el curso aumente.
          </p>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={disabled}
            className={`mt-6 flex h-12 w-full items-center px-5 text-[13px] font-medium uppercase tracking-[.06em] transition-colors ${
              disabled
                ? "cursor-not-allowed bg-[var(--surface2)] text-[var(--faint)] opacity-70"
                : "bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-600)]"
            }`}
          >
            {buttonLabel}
          </button>

          {payError && (
            <p className="mt-3 border-l-[3px] border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-[13px] text-[var(--danger)]">
              {payError}
            </p>
          )}

          <p className="mt-4 text-[12px] leading-[1.5] text-[var(--faint)]">
            Podés cancelar la recurrencia cuando quieras. La baja aplica al
            fin del período pagado.
          </p>
        </div>
      </aside>

      <Toast message={toast} />
    </div>
  );
}

function RadioSquare({ active }: { active: boolean }) {
  return (
    <span
      className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center border-2 ${
        active ? "border-[var(--accent)]" : "border-[var(--line2)]"
      }`}
    >
      {active && <span className="h-2 w-2 bg-[var(--accent)]" />}
    </span>
  );
}
