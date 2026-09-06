"use client";

import { useState } from "react";
import Link from "next/link";
import type { Course, Enrollment, Receipt } from "@/lib/types";
import { BackLink } from "@/components/ui/BackLink";
import { StatusChip } from "@/components/ui/StatusChip";
import { ProgressBar } from "@/components/ui/ProgressBar";

const AGENDA = [
  { dia: "04", mes: "SEP", titulo: "Explotación de XSS almacenado", hora: "19:00" },
  { dia: "08", mes: "SEP", titulo: "Consultoría abierta de laboratorio", hora: "18:30" },
  { dia: "11", mes: "SEP", titulo: "Autenticación: JWT y sesiones", hora: "19:00" },
];

export function DocenteClient({
  docente,
  courses,
  enrollments,
  queue,
}: {
  docente: string;
  courses: Course[];
  enrollments: Enrollment[];
  queue: Receipt[];
}) {
  const [code, setCode] = useState(courses[0]?.code ?? "");

  if (courses.length === 0) {
    return (
      <div>
        <div className="border-b-2 border-[var(--line)] px-[34px] py-[26px]">
          <BackLink href="/" />
          <h1
            className="mt-5 font-bold uppercase text-[var(--text)]"
            style={{ fontFamily: "var(--font-humane)", fontSize: "56px", lineHeight: 0.84 }}
          >
            Todavía no tenés cursos a cargo
          </h1>
          <p className="mt-2 text-[13.5px] text-[var(--dim)]">{docente}</p>
        </div>
        <div className="px-[34px] py-10">
          <p className="max-w-[52ch] text-[14.5px] leading-[1.6] text-[var(--dim)]">
            Cuando administración te asigne un curso como docente, tus
            alumnos y comprobantes pendientes van a aparecer acá.
          </p>
        </div>
      </div>
    );
  }

  const asDropdown = courses.length > 5;
  const students = enrollments.filter((e) => e.code === code);
  const totalAlumnos = new Set(
    enrollments.filter((e) => courses.some((c) => c.code === e.code)).map((e) => e.id)
  ).size;
  const pending = queue.filter((q) => q.curso === code);

  const drive = [
    { path: `/${code}/modulo-03/slides`, items: "7 archivos", visible: true },
    { path: `/${code}/modulo-03/labs`, items: "4 archivos", visible: true },
    { path: `/${code}/modulo-04`, items: "11 archivos", visible: false },
  ];

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
              Panel docente
            </h1>
            <p className="mt-2 text-[13.5px] text-[var(--dim)]">
              {docente} · {courses.length}{" "}
              {courses.length === 1 ? "curso a cargo" : "cursos a cargo"} ·{" "}
              {totalAlumnos} alumnos
            </p>
          </div>
          <button className="inline-flex h-11 items-center bg-[var(--accent)] px-5 text-[13px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-600)]">
            Programar clase
          </button>
        </div>

        <div className="mt-6">
          {asDropdown ? (
            <select
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-10 border border-[var(--line2)] bg-[var(--surface)] px-3 text-[13px]"
            >
              {courses.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {c.titulo}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex flex-wrap gap-6 border-b border-[var(--line)]">
              {courses.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCode(c.code)}
                  className={`border-b-[3px] pb-3 text-[13px] font-medium uppercase tracking-[.04em] transition-colors ${
                    c.code === code
                      ? "border-b-[var(--accent)] text-[var(--text)]"
                      : "border-b-transparent text-[var(--faint)] hover:text-[var(--dim)]"
                  }`}
                >
                  {c.code} · {c.titulo.split(/\s*[—:]\s*/)[0]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 px-[34px] py-6">
        <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] lg:col-span-8">
          <div className="border-b border-[var(--line)] px-6 py-4 text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            Alumnos — {code}
          </div>
          <div className="grid grid-cols-[1.4fr_.95fr_.8fr_auto] gap-4 border-b border-[var(--line)] px-6 py-3 text-[11px] font-medium uppercase tracking-[.08em] text-[var(--faint)]">
            <span>Alumno</span>
            <span>Estado</span>
            <span>Progreso</span>
            <span className="justify-self-end">Último pago</span>
          </div>
          {students.map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-[1.4fr_.95fr_.8fr_auto] items-center gap-4 border-b border-[var(--line)] px-6 py-3.5 text-[13px] last:border-b-0"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--line2)] text-[11px] font-medium">
                  {s.ini}
                </span>
                {s.nombre}
              </span>
              <StatusChip estado={s.estado} />
              <ProgressBar
                percent={parseInt(s.prog, 10)}
                tone={s.estado === "mora" ? "danger" : s.estado === "finalizada" ? "dim" : "accent"}
              />
              <span className="justify-self-end text-[var(--dim)]">{s.pago}</span>
            </div>
          ))}
          <div className="border-t border-[var(--line)] px-6 py-3 text-[12.5px] text-[var(--faint)]">
            El estado de mora lo administra la dirección. Como docente lo
            ves, pero no lo modificás.
          </div>
        </div>

        <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] p-6 lg:col-span-4">
          <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            Calendario en vivo
          </div>
          <div className="mt-4 flex flex-col gap-4">
            {AGENDA.map((a) => (
              <div key={a.titulo} className="flex items-start gap-4">
                <div className="text-center">
                  <div
                    className="font-bold text-[var(--text)]"
                    style={{ fontFamily: "var(--font-humane)", fontSize: "30px", lineHeight: 0.9 }}
                  >
                    {a.dia}
                  </div>
                  <div className="text-[10.5px] uppercase tracking-[.08em] text-[var(--faint)]">
                    {a.mes}
                  </div>
                </div>
                <div>
                  <div className="text-[13.5px]">{a.titulo}</div>
                  <div className="mt-1 text-[12px] text-[var(--faint)]">
                    {a.hora} · {code}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] p-6 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
              Material en Drive
            </div>
            <button className="h-9 border border-[var(--line2)] px-4 text-[12px] font-medium uppercase tracking-[.06em] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
              Vincular carpeta
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-px bg-[var(--line)]">
            {drive.map((d) => (
              <div
                key={d.path}
                className="flex items-center justify-between gap-4 bg-[var(--surface)] px-4 py-3"
              >
                <div>
                  <div className="font-mono text-[13px] text-[var(--text)]">{d.path}</div>
                  <div className="mt-0.5 text-[12px] text-[var(--faint)]">{d.items}</div>
                </div>
                <span
                  className="border px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[.08em]"
                  style={{
                    borderColor: "var(--line2)",
                    color: d.visible ? "var(--good)" : "var(--dim)",
                  }}
                >
                  {d.visible ? "Visible" : "Oculto"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] p-6 lg:col-span-5">
          <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            Comprobantes del curso
          </div>
          <div
            className="mt-3 font-bold"
            style={{
              fontFamily: "var(--font-humane)",
              fontSize: "78px",
              lineHeight: 0.78,
              color: pending.length ? "var(--accent)" : "var(--good)",
            }}
          >
            {pending.length}
          </div>
          <p className="mt-2 text-[13.5px] leading-[1.5] text-[var(--dim)]">
            esperando revisión. Podés aprobar los de tus cursos; el resto lo
            ve administración.
          </p>
          <Link
            href="/admin/pagos"
            className="mt-5 inline-flex h-11 items-center border border-[var(--accent)] px-5 text-[13px] font-medium uppercase tracking-[.06em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
          >
            Abrir cola de revisión
          </Link>
        </div>
      </div>
    </div>
  );
}
