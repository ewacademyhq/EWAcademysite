"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Enrollment } from "@/lib/types";
import { courseByCode, deudaTotal, moraRecargo, ESTADOS } from "@/lib/business";
import { formatARS } from "@/lib/format";
import { BackLink } from "@/components/ui/BackLink";
import { StatusChip } from "@/components/ui/StatusChip";
import { ProgressBar } from "@/components/ui/ProgressBar";

const today = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());
const todayLabel = today.charAt(0).toUpperCase() + today.slice(1);

export function PanelClient({ enrollments }: { enrollments: Enrollment[] }) {
  const [code, setCode] = useState(enrollments[0]?.code ?? "");
  const enrollment = enrollments.find((e) => e.code === code) ?? enrollments[0];
  const course = courseByCode(enrollment.code);
  const mora = enrollment.estado === "mora";
  const recargo = mora ? moraRecargo(course, enrollment.cuota) : 0;
  const asDropdown = enrollments.length > 5;

  const payments = useMemo(
    () => [
      {
        mes: "Agosto 2026",
        monto: enrollment.cuota,
        medio: mora ? "Sin pago" : enrollment.medio,
        estado: mora ? "mora" : "activa",
        estadoLabel: mora ? "Vencida" : "Pagada",
      },
      { mes: "Julio 2026", monto: enrollment.cuota, medio: enrollment.medio, estado: "activa", estadoLabel: "Pagada" },
      { mes: "Junio 2026", monto: enrollment.cuota, medio: enrollment.medio, estado: "activa", estadoLabel: "Pagada" },
      { mes: "Mayo 2026", monto: enrollment.cuota, medio: enrollment.medio, estado: "activa", estadoLabel: "Pagada" },
    ],
    [enrollment, mora]
  );

  if (!course) return null;

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
              {todayLabel} · {enrollments.length}{" "}
              {enrollments.length === 1 ? "curso activo" : "cursos activos"}
            </p>
          </div>
          <StatusChip estado={enrollment.estado} />
        </div>

        <div className="mt-6">
          {asDropdown ? (
            <select
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-10 border border-[var(--line2)] bg-[var(--surface)] px-3 text-[13px]"
            >
              {enrollments.map((e) => (
                <option key={e.code} value={e.code}>
                  {e.code} · {courseByCode(e.code)?.titulo}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex flex-wrap gap-6 border-b border-[var(--line)]">
              {enrollments.map((e) => (
                <button
                  key={e.code}
                  onClick={() => setCode(e.code)}
                  className={`border-b-[3px] pb-3 text-[13px] font-medium uppercase tracking-[.04em] transition-colors ${
                    e.code === code
                      ? "border-b-[var(--accent)] text-[var(--text)]"
                      : "border-b-transparent text-[var(--faint)] hover:text-[var(--dim)]"
                  }`}
                >
                  {e.code} · {courseByCode(e.code)?.titulo.split(/\s*[—:]\s*/)[0]}
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
              La cuota venció el 10/08 y pasaron los 5 días de gracia. El
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
            {course.modalidad === "cohorte" ? "Cohorte 2026-B" : "Autogestionado"}{" "}
            · módulo 3 de 6 · docente {course.docente}
          </p>
          <div className="mt-5">
            <ProgressBar percent={parseInt(enrollment.prog, 10)} tone={mora ? "danger" : "accent"} key={enrollment.code} />
          </div>
          <Link
            href={`/curso/${course.code}`}
            className="mt-6 inline-flex h-11 items-center bg-[var(--accent)] px-5 text-[13px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-600)]"
          >
            Entrar al curso
          </Link>
        </div>

        <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] p-6 lg:col-span-5">
          <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            Próxima clase en vivo
          </div>
          <h3 className="mt-2 text-[16px] font-medium">
            Clase en vivo — {course.titulo.split(/\s*[—:]\s*/)[0]}
          </h3>
          <p className="mt-1 text-[13px] text-[var(--dim)]">
            Jue 04/09 · 19:00–21:00 ART
          </p>
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
            {mora ? "10/08" : "10/09"}
          </div>
          <p className="mt-3 text-[13px] leading-[1.5] text-[var(--dim)]">
            {mora
              ? "Vencida hace 21 días. Regularizá para reactivar el acceso."
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
            <button className="text-[12.5px] text-[var(--dim)] underline-offset-2 hover:text-[var(--accent)] hover:underline">
              Ver todo
            </button>
          </div>
          {payments.map((p, i) => (
            <div
              key={p.mes}
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
          ))}
        </div>
      </div>
    </div>
  );
}
