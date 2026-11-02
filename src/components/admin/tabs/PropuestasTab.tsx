"use client";

import { useEffect, useState } from "react";
import type { Course, PagoTipo } from "@/lib/types";
import { formatARS } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/date";

interface ModuleRowLite {
  id: number;
  numero: number;
  titulo: string;
}

function Modulos({ code }: { code: string }) {
  const [modulos, setModulos] = useState<ModuleRowLite[] | null>(null);

  useEffect(() => {
    let cancelado = false;
    const supabase = createClient();
    supabase
      .from("modules")
      .select("id, numero, titulo")
      .eq("course_code", code)
      .order("numero")
      .then(({ data }) => {
        if (!cancelado) setModulos((data as ModuleRowLite[] | null) ?? []);
      });
    return () => {
      cancelado = true;
    };
  }, [code]);

  if (modulos === null) return <p className="text-[12.5px] text-[var(--faint)]">Cargando módulos…</p>;
  if (modulos.length === 0) return <p className="text-[12.5px] text-[var(--faint)]">Todavía no cargó ningún módulo.</p>;

  return (
    <ul className="flex flex-col gap-1">
      {modulos.map((m) => (
        <li key={m.id} className="text-[13px] text-[var(--dim)]">
          #{m.numero} {m.titulo}
        </li>
      ))}
    </ul>
  );
}

const inputClass =
  "h-10 w-full border border-[var(--line2)] bg-[var(--surface)] px-3 text-[13.5px] text-[var(--text)]";
const labelClass = "text-[11px] font-medium uppercase tracking-[.14em] text-[var(--faint)]";

function PropuestaPendiente({
  course,
  onAprobar,
  onRechazar,
}: {
  course: Course;
  onAprobar: (
    code: string,
    terminos: {
      precio: number;
      comision: number;
      pagoTipo: PagoTipo;
      pagoValor: number;
      cupoMaximo: number | null;
      cupoMinimo: number | null;
      fechaInicioIso: string | null;
      fechaFinIso: string | null;
    }
  ) => Promise<boolean>;
  onRechazar: (code: string, motivo: string) => Promise<boolean>;
}) {
  const [precio, setPrecio] = useState("80000");
  const [comision, setComision] = useState("6.2");
  const [pagoTipo, setPagoTipo] = useState<PagoTipo>("pct");
  const [pagoValor, setPagoValor] = useState("35");
  const [cupoMaximo, setCupoMaximo] = useState("");
  const [cupoMinimo, setCupoMinimo] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [trabajando, setTrabajando] = useState(false);

  async function aprobar() {
    setTrabajando(true);
    await onAprobar(course.code, {
      precio: Number(precio) || 0,
      comision: Number(comision) || 0,
      pagoTipo,
      pagoValor: Number(pagoValor) || 0,
      cupoMaximo: cupoMaximo ? Number(cupoMaximo) : null,
      cupoMinimo: course.modalidad === "cohorte" && cupoMinimo ? Number(cupoMinimo) : null,
      fechaInicioIso: course.modalidad === "cohorte" && fechaInicio ? fechaInicio : null,
      fechaFinIso: course.modalidad === "cohorte" && fechaFin ? fechaFin : null,
    });
    setTrabajando(false);
  }

  async function rechazar() {
    if (!motivo.trim()) return;
    setTrabajando(true);
    await onRechazar(course.code, motivo.trim());
    setTrabajando(false);
  }

  return (
    <div className="border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[.1em] text-[var(--accent)]">
            {course.code} · {course.vertical} · {course.modalidad === "cohorte" ? "Cohorte" : "Autogestionado"}
          </div>
          <h3 className="mt-1 text-[18px] font-medium">{course.titulo}</h3>
          <p className="mt-1 text-[13px] text-[var(--dim)]">Propuesto por {course.docente}</p>
        </div>
      </div>

      <p className="mt-3 text-[14px] leading-[1.6] text-[var(--dim)]">{course.desc}</p>
      <p className="mt-2 text-[13px] text-[var(--faint)]">
        Duración: {course.duracion}
        {course.modalidad === "cohorte" && course.clasesTotales ? ` · ${course.clasesTotales} clases` : ""}
      </p>

      <div className="mt-3">
        <div className={labelClass}>Módulos propuestos</div>
        <div className="mt-2">
          <Modulos code={course.code} />
        </div>
      </div>

      {!rechazando ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={labelClass}>Precio (ARS)</label>
              <input className={`${inputClass} mt-1.5`} value={precio} onChange={(e) => setPrecio(e.target.value.replace(/[^0-9]/g, ""))} />
            </div>
            <div>
              <label className={labelClass}>Comisión (%)</label>
              <input className={`${inputClass} mt-1.5`} value={comision} onChange={(e) => setComision(e.target.value.replace(/[^0-9.]/g, ""))} />
            </div>
            <div>
              <label className={labelClass}>Pago docente</label>
              <select className={`${inputClass} mt-1.5`} value={pagoTipo} onChange={(e) => setPagoTipo(e.target.value as PagoTipo)}>
                <option value="pct">% del precio</option>
                <option value="fijo">Monto fijo</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{pagoTipo === "pct" ? "Porcentaje (%)" : "Monto (ARS)"}</label>
              <input className={`${inputClass} mt-1.5`} value={pagoValor} onChange={(e) => setPagoValor(e.target.value.replace(/[^0-9.]/g, ""))} />
            </div>
            <div>
              <label className={labelClass}>Cupo máximo</label>
              <input className={`${inputClass} mt-1.5`} placeholder="Sin límite" value={cupoMaximo} onChange={(e) => setCupoMaximo(e.target.value.replace(/[^0-9]/g, ""))} />
            </div>
            {course.modalidad === "cohorte" && (
              <>
                <div>
                  <label className={labelClass}>Cupo mínimo</label>
                  <input className={`${inputClass} mt-1.5`} placeholder="Opcional" value={cupoMinimo} onChange={(e) => setCupoMinimo(e.target.value.replace(/[^0-9]/g, ""))} />
                </div>
                <div>
                  <label className={labelClass}>Fecha de inicio</label>
                  <input type="date" className={`${inputClass} mt-1.5`} value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Fin de cohorte</label>
                  <input type="date" min={todayISO()} className={`${inputClass} mt-1.5`} value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                </div>
              </>
            )}
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={aprobar}
              disabled={trabajando}
              className="h-10 bg-[var(--accent)] px-5 text-[12.5px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {trabajando ? "Aprobando…" : "Aprobar estructura"}
            </button>
            <button
              onClick={() => setRechazando(true)}
              disabled={trabajando}
              className="h-10 border border-[var(--line2)] px-5 text-[12.5px] font-medium uppercase tracking-[.06em] text-[var(--danger)] hover:border-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Rechazar
            </button>
          </div>
        </>
      ) : (
        <div className="mt-5">
          <label className={labelClass}>Motivo del rechazo</label>
          <textarea
            className={`${inputClass} mt-1.5 h-20 resize-none py-2.5`}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Para que el docente sepa qué corregir antes de reenviarla"
          />
          <div className="mt-3 flex gap-3">
            <button
              onClick={rechazar}
              disabled={trabajando || !motivo.trim()}
              className="h-10 bg-[var(--danger)] px-5 text-[12.5px] font-medium uppercase tracking-[.06em] text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {trabajando ? "Rechazando…" : "Confirmar rechazo"}
            </button>
            <button
              onClick={() => setRechazando(false)}
              className="h-10 px-4 text-[12.5px] text-[var(--faint)] hover:text-[var(--text)]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PropuestaAprobada({ course, onPublicar }: { course: Course; onPublicar: (code: string) => Promise<boolean> }) {
  const [trabajando, setTrabajando] = useState(false);

  async function publicar() {
    setTrabajando(true);
    await onPublicar(course.code);
    setTrabajando(false);
  }

  return (
    <div className="border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[.1em] text-[var(--accent)]">
            {course.code} · {course.vertical}
          </div>
          <h3 className="mt-1 text-[18px] font-medium">{course.titulo}</h3>
          <p className="mt-1 text-[13px] text-[var(--dim)]">
            Docente: {course.docente} · {formatARS(course.precio)}
          </p>
        </div>
        <button
          onClick={publicar}
          disabled={trabajando}
          className="h-10 shrink-0 bg-[var(--accent)] px-5 text-[12.5px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {trabajando ? "Publicando…" : "Publicar en el catálogo"}
        </button>
      </div>
      <div className="mt-3">
        <div className={labelClass}>Contenido cargado hasta ahora</div>
        <div className="mt-2">
          <Modulos code={course.code} />
        </div>
      </div>
    </div>
  );
}

export function PropuestasTab({
  courses,
  onAprobar,
  onRechazar,
  onPublicar,
}: {
  courses: Course[];
  onAprobar: (
    code: string,
    terminos: {
      precio: number;
      comision: number;
      pagoTipo: PagoTipo;
      pagoValor: number;
      cupoMaximo: number | null;
      cupoMinimo: number | null;
      fechaInicioIso: string | null;
      fechaFinIso: string | null;
    }
  ) => Promise<boolean>;
  onRechazar: (code: string, motivo: string) => Promise<boolean>;
  onPublicar: (code: string) => Promise<boolean>;
}) {
  const pendientes = courses.filter((c) => c.estado === "propuesta");
  const aprobadas = courses.filter((c) => c.estado === "aprobada");
  const rechazadas = courses.filter((c) => c.estado === "rechazada");

  return (
    <div className="flex flex-col gap-10 px-[34px] py-8">
      <section>
        <h2 className="text-[20px] font-medium">Pendientes de aprobar estructura</h2>
        <p className="mt-1 text-[13px] text-[var(--dim)]">
          El docente mandó la estructura — completá precio y demás términos comerciales para aprobarla.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          {pendientes.length === 0 && (
            <p className="text-[13.5px] text-[var(--faint)]">No hay propuestas esperando revisión.</p>
          )}
          {pendientes.map((c) => (
            <PropuestaPendiente key={c.code} course={c} onAprobar={onAprobar} onRechazar={onRechazar} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[20px] font-medium">Esperando publicación</h2>
        <p className="mt-1 text-[13px] text-[var(--dim)]">
          Estructura ya aprobada — el docente está cargando el contenido. Publicá cuando esté listo.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          {aprobadas.length === 0 && (
            <p className="text-[13.5px] text-[var(--faint)]">No hay cursos esperando publicación.</p>
          )}
          {aprobadas.map((c) => (
            <PropuestaAprobada key={c.code} course={c} onPublicar={onPublicar} />
          ))}
        </div>
      </section>

      {rechazadas.length > 0 && (
        <section>
          <h2 className="text-[20px] font-medium">Rechazadas</h2>
          <p className="mt-1 text-[13px] text-[var(--dim)]">
            El docente puede editarlas y volver a mandarlas desde su panel.
          </p>
          <div className="mt-4 flex flex-col gap-px bg-[var(--line)]">
            {rechazadas.map((c) => (
              <div key={c.code} className="bg-[var(--surface)] px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium">
                    {c.code} · {c.titulo}
                  </span>
                  <span className="text-[12px] text-[var(--faint)]">{c.docente}</span>
                </div>
                {c.motivoRechazo && (
                  <p className="mt-1.5 text-[13px] text-[var(--danger)]">Motivo: {c.motivoRechazo}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
