"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DIAS_SEMANA,
  encontrarConflictoDePatron,
  ocurrenciasEnRango,
  type PatronCurso,
} from "@/lib/schedule";

interface SesionSuelta {
  courseCode: string;
  titulo: string;
  fecha: string;
}

interface OcupacionDia {
  hora: string | null;
  titulo: string;
  code: string;
}

const MESES_HORIZONTE = 14;

function primerDiaDeMes(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function sumarMeses(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function yyyyMmDd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Calendario visual de disponibilidad: muestra, mes por mes, los horarios ya
 * ocupados por cualquier curso de cohorte (patrón semanal) o clase suelta ya
 * agendada — para elegir un horario libre antes de proponer/crear un curso.
 * Navegable varios meses hacia adelante porque un curso se puede armar con
 * 2-3 meses de anticipación (hay un proceso de venta antes de que arranque).
 * El chequeo real y bloqueante vive en la base (trigger) y en las rutas de
 * Zoom — esto es solo para dar feedback inmediato en la UI.
 */
export function HorarioCalendar({
  diasSeleccionados,
  horaSeleccionada,
  fechaInicio,
  fechaFin,
  clasesTotales,
  excludeCode,
  onElegirFecha,
}: {
  diasSeleccionados: number[];
  horaSeleccionada: string;
  fechaInicio: string;
  fechaFin: string | null;
  clasesTotales: number | null;
  excludeCode?: string;
  onElegirFecha?: (fecha: string) => void;
}) {
  const [patrones, setPatrones] = useState<PatronCurso[]>([]);
  const [sesiones, setSesiones] = useState<SesionSuelta[]>([]);
  const [cargado, setCargado] = useState(false);
  const hoy = useMemo(() => new Date(), []);
  const [mesVisible, setMesVisible] = useState(() => primerDiaDeMes(hoy));

  useEffect(() => {
    let cancelado = false;
    const supabase = createClient();
    Promise.all([
      supabase
        .from("courses")
        .select("code, titulo, dias_semana, hora_inicio, fecha_inicio, fecha_fin, clases_totales")
        .eq("modalidad", "cohorte")
        .in("estado", ["propuesta", "aprobada", "publicado"])
        .not("dias_semana", "is", null)
        .not("hora_inicio", "is", null),
      supabase
        .from("course_sessions")
        .select("course_code, titulo, fecha")
        .gte("fecha", new Date().toISOString()),
    ]).then(([cursosRes, sesionesRes]) => {
      if (cancelado) return;
      setPatrones(
        ((cursosRes.data ?? []) as Array<{
          code: string;
          titulo: string;
          dias_semana: number[] | null;
          hora_inicio: string | null;
          fecha_inicio: string | null;
          fecha_fin: string | null;
          clases_totales: number | null;
        }>).map((r) => ({
          code: r.code,
          titulo: r.titulo,
          diasSemana: r.dias_semana,
          horaInicio: r.hora_inicio ? r.hora_inicio.slice(0, 5) : null,
          fechaInicio: r.fecha_inicio,
          fechaFin: r.fecha_fin,
          clasesTotales: r.clases_totales,
        }))
      );
      setSesiones(
        ((sesionesRes.data ?? []) as Array<{ course_code: string; titulo: string; fecha: string }>).map((r) => ({
          courseCode: r.course_code,
          titulo: r.titulo,
          fecha: r.fecha,
        }))
      );
      setCargado(true);
    });
    return () => {
      cancelado = true;
    };
  }, []);

  const otrosPatrones = patrones.filter((p) => p.code !== excludeCode);

  const ocupacionPorDia = useMemo(() => {
    const mapa = new Map<string, OcupacionDia[]>();
    const desde = yyyyMmDd(mesVisible);
    const hasta = yyyyMmDd(sumarMeses(mesVisible, 1));

    for (const patron of otrosPatrones) {
      for (const fecha of ocurrenciasEnRango(patron, desde, hasta)) {
        const lista = mapa.get(fecha) ?? [];
        lista.push({ hora: patron.horaInicio, titulo: patron.titulo, code: patron.code });
        mapa.set(fecha, lista);
      }
    }
    for (const sesion of sesiones) {
      if (sesion.courseCode === excludeCode) continue;
      const fecha = sesion.fecha.slice(0, 10);
      if (fecha < desde || fecha >= hasta) continue;
      const hora = new Date(sesion.fecha).toTimeString().slice(0, 5);
      const lista = mapa.get(fecha) ?? [];
      lista.push({ hora, titulo: sesion.titulo, code: sesion.courseCode });
      mapa.set(fecha, lista);
    }
    return mapa;
  }, [otrosPatrones, sesiones, mesVisible, excludeCode]);

  const conflicto =
    diasSeleccionados.length > 0 && horaSeleccionada && fechaInicio
      ? encontrarConflictoDePatron(
          { diasSemana: diasSeleccionados, horaInicio: horaSeleccionada, fechaInicio, fechaFin, clasesTotales },
          otrosPatrones,
          excludeCode
        )
      : null;

  const limiteFuturo = sumarMeses(primerDiaDeMes(hoy), MESES_HORIZONTE);
  const celdas = useMemo(() => {
    const primerDia = mesVisible.getDay(); // 0=domingo
    const offset = primerDia === 0 ? 6 : primerDia - 1; // arranca en lunes
    const diasEnMes = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0).getDate();
    const celdas: (Date | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= diasEnMes; d++) celdas.push(new Date(mesVisible.getFullYear(), mesVisible.getMonth(), d));
    return celdas;
  }, [mesVisible]);

  return (
    <div className="border border-[var(--line2)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMesVisible((m) => sumarMeses(m, -1))}
          disabled={mesVisible <= primerDiaDeMes(hoy)}
          className="h-8 px-3 text-[12px] uppercase tracking-[.06em] text-[var(--faint)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          ‹ Anterior
        </button>
        <div className="text-[13.5px] font-medium">
          {mesVisible.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
        </div>
        <button
          type="button"
          onClick={() => setMesVisible((m) => sumarMeses(m, 1))}
          disabled={mesVisible >= limiteFuturo}
          className="h-8 px-3 text-[12px] uppercase tracking-[.06em] text-[var(--faint)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          Siguiente ›
        </button>
      </div>

      {!cargado ? (
        <p className="mt-4 text-[12.5px] text-[var(--faint)]">Cargando ocupación…</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-7 gap-1">
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <div key={i} className="text-center text-[10.5px] font-medium uppercase text-[var(--faint)]">
                {d}
              </div>
            ))}
            {celdas.map((fecha, i) => {
              if (!fecha) return <div key={i} />;
              const key = yyyyMmDd(fecha);
              const ocupado = ocupacionPorDia.get(key) ?? [];
              const esPasado = key < yyyyMmDd(hoy);
              const esCandidato = diasSeleccionados.includes(fecha.getDay() === 0 ? 7 : fecha.getDay()) && key >= fechaInicio;
              return (
                <button
                  type="button"
                  key={i}
                  disabled={esPasado || !onElegirFecha}
                  onClick={() => onElegirFecha?.(key)}
                  title={ocupado.map((o) => `${o.hora ?? ""} ${o.titulo} (${o.code})`).join(" · ")}
                  className={`flex min-h-[46px] flex-col items-center justify-start gap-0.5 border px-1 py-1 text-[11px] transition-colors ${
                    esPasado
                      ? "border-transparent text-[var(--faint)] opacity-40"
                      : ocupado.length > 0
                      ? "border-[var(--danger)] bg-[var(--danger-soft)]"
                      : esCandidato
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-[var(--line)] hover:border-[var(--line2)]"
                  } ${onElegirFecha && !esPasado ? "cursor-pointer" : "cursor-default"}`}
                >
                  <span>{fecha.getDate()}</span>
                  {ocupado.length > 0 && <span className="text-[9.5px] text-[var(--danger)]">{ocupado.length} ocupado{ocupado.length > 1 ? "s" : ""}</span>}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-[11.5px] leading-[1.5] text-[var(--faint)]">
            <span className="text-[var(--danger)]">■</span> horario ya ocupado por otro curso (clase recurrente o
            agendada) — con una sola cuenta de Zoom no se puede dar dos a la vez.
            {diasSeleccionados.length > 0 && (
              <>
                {" "}
                <span className="text-[var(--accent)]">■</span> días que caerían dentro del horario elegido más abajo.
              </>
            )}
          </p>

          {conflicto && (
            <p className="mt-3 border-l-[3px] border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-2.5 text-[13px] text-[var(--danger)]">
              El horario elegido choca con &quot;{conflicto.titulo}&quot; ({conflicto.code}).
            </p>
          )}
        </>
      )}
    </div>
  );
}

export { DIAS_SEMANA };
