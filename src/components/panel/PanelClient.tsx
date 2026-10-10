"use client";

import { useState } from "react";
import Link from "next/link";
import type { Course, Enrollment } from "@/lib/types";
import type { PaymentRow } from "@/lib/data/mycourse";
import { deudaTotal, moraRecargo, ESTADOS } from "@/lib/business";
import { isoToDMY, bajaEfectivaLabel } from "@/lib/date";
import { formatARS } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { BackLink } from "@/components/ui/BackLink";
import { StatusChip } from "@/components/ui/StatusChip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toast } from "@/components/ui/Toast";
import { SUPPORT_WHATSAPP_URL, SUPPORT_EMAIL } from "@/lib/contact";

function AyudaLinks() {
  return (
    <div className="flex items-center gap-4 text-[12px] font-medium uppercase tracking-[.06em] text-[var(--faint)]">
      <a
        href={SUPPORT_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-[var(--accent)] hover:underline"
      >
        Ayuda por WhatsApp
      </a>
      <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-[var(--accent)] hover:underline">
        Escribinos
      </a>
    </div>
  );
}

const today = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());
const todayLabel = today.charAt(0).toUpperCase() + today.slice(1);

function diaDiez(offsetMonths: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offsetMonths);
  d.setDate(10);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function proximoVencimiento(mora: boolean): string {
  if (!mora) {
    const now = new Date();
    return diaDiez(now.getDate() > 10 ? 1 : 0);
  }
  const now = new Date();
  return diaDiez(now.getDate() <= 10 ? -1 : 0);
}

export function PanelClient({
  enrollments,
  courses,
  paymentsByEnrollment,
}: {
  enrollments: Enrollment[];
  courses: Course[];
  paymentsByEnrollment: Record<number, PaymentRow[]>;
}) {
  const [enroll, setEnroll] = useState(enrollments);
  const [code, setCode] = useState(enrollments[0]?.code ?? "");
  const [confirmBaja, setConfirmBaja] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const enrollment = enroll.find((e) => e.code === code) ?? enroll[0];
  const course = courses.find((c) => c.code === enrollment?.code);
  const mora = enrollment?.estado === "mora";
  const recargo = mora && course ? moraRecargo(course, enrollment.cuota) : 0;
  const asDropdown = enroll.length > 5;
  const vencimiento = enrollment ? proximoVencimiento(mora) : "";
  const otrosCursos = courses.filter((c) => !enroll.some((e) => e.code === c.code));

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }

  async function solicitarBaja() {
    if (!enrollment) return;
    const supabase = createClient();
    const { error } = await supabase.rpc("request_baja", { p_enrollment_id: enrollment.id });
    setConfirmBaja(false);
    if (error) {
      flash(`No se pudo registrar la baja: ${error.message}`);
      return;
    }
    setEnroll((es) =>
      es.map((e) => (e.id === enrollment.id ? { ...e, bajaSolicitadaAt: new Date().toISOString() } : e))
    );
    flash("Baja registrada");
  }

  async function cancelarBaja() {
    if (!enrollment) return;
    const supabase = createClient();
    const { error } = await supabase.rpc("cancel_baja", { p_enrollment_id: enrollment.id });
    if (error) {
      flash(`No se pudo cancelar la baja: ${error.message}`);
      return;
    }
    setEnroll((es) => es.map((e) => (e.id === enrollment.id ? { ...e, bajaSolicitadaAt: null } : e)));
    flash("Baja cancelada");
  }

  const payments = (enrollment ? paymentsByEnrollment[enrollment.id] ?? [] : []).map((p) => ({
    id: p.id,
    mes: isoToDMY(p.periodo),
    monto: Number(p.monto),
    medio: p.medio,
    estado: p.estado === "acreditado" ? "activa" : "mora",
    estadoLabel: p.estado === "acreditado" ? "Pagada" : p.estado,
  }));

  if (!enrollment || !course) {
    return (
      <div>
        <div className="border-b-2 border-[var(--line)] px-[34px] py-[26px]">
          <BackLink href="/" />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <h1
              className="font-bold uppercase text-[var(--text)]"
              style={{ fontFamily: "var(--font-humane)", fontSize: "56px", lineHeight: 0.84 }}
            >
              Todavía no tenés cursos
            </h1>
            <AyudaLinks />
          </div>
          <p className="mt-2 text-[13.5px] text-[var(--dim)]">{todayLabel}</p>
        </div>
        <div className="px-[34px] py-10">
          <p className="max-w-[52ch] text-[14.5px] leading-[1.6] text-[var(--dim)]">
            Cuando te matricules en un curso, tu progreso y tus pagos van a
            aparecer acá.
          </p>
          <Link
            href="/#catalogo"
            className="mt-5 inline-flex h-11 items-center bg-[var(--accent)] px-5 text-[13px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-600)]"
          >
            Ver catálogo de cursos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b-2 border-[var(--line)] px-[34px] py-[26px]">
        <BackLink href="/" />
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              className="font-bold uppercase text-[var(--text)]"
              style={{ fontFamily: "var(--font-humane)", fontSize: "56px", lineHeight: 0.84 }}
            >
              Hola, {enrollment.nombre.split(" ")[0]}
            </h1>
            <p className="mt-2 text-[13.5px] text-[var(--dim)]">
              {todayLabel} · {enroll.length}{" "}
              {enroll.length === 1 ? "curso activo" : "cursos activos"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <StatusChip estado={enrollment.estado} />
            <AyudaLinks />
          </div>
        </div>

        <div className="mt-6">
          {asDropdown ? (
            <select
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-10 border border-[var(--line2)] bg-[var(--surface)] px-3 text-[13px]"
            >
              {enroll.map((e) => (
                <option key={e.code} value={e.code}>
                  {e.code} · {courses.find((c) => c.code === e.code)?.titulo}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex flex-wrap gap-6 border-b border-[var(--line)]">
              {enroll.map((e) => (
                <button
                  key={e.code}
                  onClick={() => setCode(e.code)}
                  className={`border-b-[3px] pb-3 text-[13px] font-medium uppercase tracking-[.04em] transition-colors ${
                    e.code === code
                      ? "border-b-[var(--accent)] text-[var(--text)]"
                      : "border-b-transparent text-[var(--faint)] hover:text-[var(--dim)]"
                  }`}
                >
                  {e.code} ·{" "}
                  {courses.find((c) => c.code === e.code)?.titulo.split(/\s*[—:]\s*/)[0]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 px-[34px] py-6">
        {mora && (
          <div
            className="col-span-12 border-l-4 border-[var(--danger)] bg-[var(--danger-soft)] p-6"
            style={{ animation: "slideUp .3s ease" }}
          >
            <h2 className="text-[17px] font-medium">Matrícula pausada por mora</h2>
            <p className="mt-2 text-[14.5px] leading-[1.6]">
              La cuota venció el {vencimiento} y pasaron los días de gracia. El
              acceso a material y clases en vivo está suspendido — tu
              progreso y tus entregas siguen guardados.
            </p>
            <p className="mt-3 text-[13.5px] leading-[1.6] text-[var(--dim)]">
              Regularizás por{" "}
              <strong className="font-medium text-[var(--text)]">
                {formatARS(deudaTotal(enrollment))}
              </strong>
              : la cuota vencida a su valor congelado de{" "}
              {formatARS(enrollment.cuota)}
              {recargo
                ? ` más ${formatARS(recargo)} de recargo por mora`
                : ", sin recargo por mora"}
              . Como pasaste el período de gracia, desde el mes que viene tu
              cuota pasa a {formatARS(course.precio)}, el precio de lista
              vigente.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/checkout/${course.code}`}
                className="inline-flex h-11 items-center bg-[var(--danger)] px-5 text-[13px] font-medium uppercase tracking-[.06em] text-white"
              >
                Regularizar {formatARS(deudaTotal(enrollment))}
              </Link>
              <button className="inline-flex h-11 items-center border border-[var(--danger)] px-5 text-[13px] font-medium uppercase tracking-[.06em] text-[var(--danger)]">
                Subir comprobante
              </button>
            </div>
          </div>
        )}

        <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] p-6 lg:col-span-7">
          <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--accent)]">
            {course.code}
          </div>
          <h2 className="mt-2 text-[22px] font-medium">{course.titulo}</h2>
          <p className="mt-2 text-[13px] text-[var(--dim)]">
            {course.modalidad === "cohorte" ? "Cohorte" : "Autogestionado"} ·
            docente {course.docente}
          </p>
          <div className="mt-5">
            <ProgressBar
              percent={parseInt(enrollment.prog, 10)}
              tone={mora ? "danger" : "accent"}
              key={enrollment.code}
            />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href={`/curso/${course.code}`}
              className="inline-flex h-11 items-center bg-[var(--accent)] px-5 text-[13px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-600)]"
            >
              Entrar al curso
            </Link>
            {enrollment.estado === "finalizada" && (
              <a
                href={`/api/certificados/${enrollment.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center border border-[var(--line2)] px-5 text-[13px] font-medium uppercase tracking-[.06em] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Ver certificado
              </a>
            )}
            {!enrollment.bajaSolicitadaAt && (
              <button
                onClick={() => setConfirmBaja(true)}
                className="text-[12px] font-medium uppercase tracking-[.06em] text-[var(--faint)] hover:text-[var(--danger)]"
              >
                Informar baja
              </button>
            )}
          </div>
          {enrollment.bajaSolicitadaAt && (
            <div className="mt-4 border-l-[3px] border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-[12.5px] leading-[1.5]">
              Baja solicitada — tu matrícula se cierra el{" "}
              <strong className="font-medium">{bajaEfectivaLabel(enrollment.bajaSolicitadaAt)}</strong>.{" "}
              <button onClick={cancelarBaja} className="font-medium uppercase tracking-[.06em] text-[var(--accent)] hover:underline">
                Cancelar baja
              </button>
            </div>
          )}
        </div>

        <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] p-6 lg:col-span-5">
          <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            Próxima clase en vivo
          </div>
          <h3 className="mt-2 text-[16px] font-medium">
            Clase en vivo — {course.titulo.split(/\s*[—:]\s*/)[0]}
          </h3>
          <p className="mt-1 text-[13px] text-[var(--dim)]">A confirmar</p>
          <div className="mt-6">
            {mora ? (
              <div className="border border-[var(--line)] bg-[var(--surface2)] px-4 py-3.5 text-[13px] text-[var(--faint)]">
                Acceso suspendido hasta regularizar
              </div>
            ) : (
              <button className="inline-flex h-11 items-center border border-[var(--accent)] px-5 text-[13px] font-medium uppercase tracking-[.06em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]">
                Abrir sala de clase
              </button>
            )}
          </div>
        </div>

        <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] p-6 sm:col-span-6 lg:col-span-4">
          <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            Próximo vencimiento
          </div>
          <div
            className="mt-3 font-bold"
            style={{
              fontFamily: "var(--font-humane)",
              fontSize: "62px",
              lineHeight: 0.8,
              color: mora ? "var(--danger)" : "var(--text)",
            }}
          >
            {vencimiento}
          </div>
          <p className="mt-3 text-[13px] leading-[1.5] text-[var(--dim)]">
            {mora
              ? "Vencida. Regularizá para reactivar el acceso."
              : `${formatARS(enrollment.cuota)} · débito automático con Mercado Pago.`}
          </p>
        </div>

        <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] p-6 sm:col-span-6 lg:col-span-4">
          <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            Tu cuota
          </div>
          <div
            className="mt-3 font-bold text-[var(--text)]"
            style={{ fontFamily: "var(--font-humane)", fontSize: "62px", lineHeight: 0.8 }}
          >
            {formatARS(enrollment.cuota)}
          </div>
          <p className="mt-3 text-[13px] leading-[1.5] text-[var(--dim)]">
            Congelada al matricularte el {enrollment.desde}. Precio actual
            del curso: {formatARS(course.precio)}.
          </p>
        </div>

        <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] p-6 lg:col-span-4">
          <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            Medio de pago
          </div>
          <h3 className="mt-3 text-[16px] font-medium">{enrollment.medio}</h3>
          <p className="mt-1 text-[13px] text-[var(--dim)]">
            {enrollment.medio === "Mercado Pago"
              ? "Débito automático · vence el 10 de cada mes"
              : "Comprobante manual · sujeto a aprobación"}
          </p>
          <button className="mt-5 inline-flex h-10 items-center border border-[var(--line2)] px-4 text-[12px] font-medium uppercase tracking-[.06em] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
            Cambiar
          </button>
        </div>

        <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)]">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
            <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
              Historial de pagos
            </div>
          </div>
          {payments.length === 0 ? (
            <div className="px-6 py-6 text-[13px] text-[var(--faint)]">
              Todavía no hay pagos registrados.
            </div>
          ) : (
            payments.map((p, i) => (
              <div
                key={p.id}
                className={`grid grid-cols-[1.1fr_1fr_.9fr_auto] items-center gap-4 px-6 py-3.5 text-[13px] ${
                  i !== payments.length - 1 ? "border-b border-[var(--line)]" : ""
                }`}
              >
                <span>{p.mes}</span>
                <span>{formatARS(p.monto)}</span>
                <span className="text-[var(--dim)]">{p.medio}</span>
                <span
                  className="justify-self-end border border-[var(--line2)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[.06em]"
                  style={{ color: ESTADOS[p.estado as "activa" | "mora"].color }}
                >
                  {p.estadoLabel}
                </span>
              </div>
            ))
          )}
        </div>

        {otrosCursos.length > 0 && (
          <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)]">
            <div className="border-b border-[var(--line)] px-6 py-4 text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
              Más cursos para vos
            </div>
            <div className="grid grid-cols-1 gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
              {otrosCursos.map((c) => (
                <div key={c.code} className="flex flex-col bg-[var(--surface)] p-5">
                  <span className="text-[11px] font-medium uppercase tracking-[.1em] text-[var(--accent)]">
                    {c.vertical}
                  </span>
                  <h4 className="mt-2 flex-1 text-[15px] font-medium leading-[1.3]">{c.titulo}</h4>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[14px] font-medium">{formatARS(c.precio)}</span>
                    <Link
                      href={`/checkout/${c.code}`}
                      className="text-[12px] font-medium uppercase tracking-[.06em] text-[var(--accent)] hover:underline"
                    >
                      Matricularme →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmBaja}
        title="¿Informar baja de este curso?"
        message={`Tu matrícula en ${course.titulo} sigue activa 30 días más desde hoy — necesitamos ese margen para resolver la situación del docente. Después de esos 30 días se cierra sola.`}
        confirmLabel="Confirmar baja"
        variant="danger"
        onCancel={() => setConfirmBaja(false)}
        onConfirm={solicitarBaja}
      />

      <Toast message={toast} />
    </div>
  );
}
