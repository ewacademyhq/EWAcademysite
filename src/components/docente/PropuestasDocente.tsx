"use client";

import { useEffect, useState } from "react";
import type { Course, Modalidad } from "@/lib/types";
import { formatARS } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

interface ModuleRowLite {
  id: number;
  numero: number;
  titulo: string;
}

const inputClass =
  "h-10 w-full border border-[var(--line2)] bg-[var(--surface)] px-3 text-[13.5px] text-[var(--text)]";
const labelClass = "text-[11px] font-medium uppercase tracking-[.14em] text-[var(--faint)]";

interface EstructuraForm {
  titulo: string;
  descripcion: string;
  vertical: string;
  modalidad: Modalidad;
  duracion: string;
  clasesTotales: string;
  modulos: string[];
}

function formVacio(primeraVertical: string): EstructuraForm {
  return {
    titulo: "",
    descripcion: "",
    vertical: primeraVertical,
    modalidad: "cohorte",
    duracion: "",
    clasesTotales: "",
    modulos: [""],
  };
}

function formDeCurso(course: Course, modulos: string[]): EstructuraForm {
  return {
    titulo: course.titulo,
    descripcion: course.desc,
    vertical: course.vertical,
    modalidad: course.modalidad,
    duracion: course.duracion,
    clasesTotales: course.clasesTotales != null ? String(course.clasesTotales) : "",
    modulos: modulos.length > 0 ? modulos : [""],
  };
}

function EstructuraFields({
  form,
  setForm,
  verticales,
}: {
  form: EstructuraForm;
  setForm: (f: EstructuraForm) => void;
  verticales: string[];
}) {
  function patch<K extends keyof EstructuraForm>(key: K, value: EstructuraForm[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Título</label>
        <input className={`${inputClass} mt-1.5`} value={form.titulo} onChange={(e) => patch("titulo", e.target.value)} />
      </div>
      <div>
        <label className={labelClass}>Descripción</label>
        <textarea
          className={`${inputClass} mt-1.5 h-24 resize-none py-2.5`}
          value={form.descripcion}
          onChange={(e) => patch("descripcion", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Vertical</label>
          <select className={`${inputClass} mt-1.5`} value={form.vertical} onChange={(e) => patch("vertical", e.target.value)}>
            {verticales.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Modalidad</label>
          <select
            className={`${inputClass} mt-1.5`}
            value={form.modalidad}
            onChange={(e) => patch("modalidad", e.target.value as Modalidad)}
          >
            <option value="cohorte">Cohorte</option>
            <option value="continuo">Autogestionado</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Duración</label>
          <input
            className={`${inputClass} mt-1.5`}
            placeholder="ej: 4 meses"
            value={form.duracion}
            onChange={(e) => patch("duracion", e.target.value)}
          />
        </div>
        {form.modalidad === "cohorte" && (
          <div>
            <label className={labelClass}>Cantidad de clases</label>
            <input
              className={`${inputClass} mt-1.5`}
              value={form.clasesTotales}
              onChange={(e) => patch("clasesTotales", e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>
        )}
      </div>
      <div>
        <label className={labelClass}>Módulos</label>
        <div className="mt-1.5 flex flex-col gap-2">
          {form.modulos.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={inputClass}
                placeholder={`Módulo ${i + 1}`}
                value={m}
                onChange={(e) => {
                  const modulos = [...form.modulos];
                  modulos[i] = e.target.value;
                  patch("modulos", modulos);
                }}
              />
              <button
                type="button"
                onClick={() => patch("modulos", form.modulos.filter((_, j) => j !== i))}
                className="h-10 shrink-0 px-3 text-[12px] uppercase text-[var(--faint)] hover:text-[var(--danger)]"
              >
                Quitar
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => patch("modulos", [...form.modulos, ""])}
            className="h-9 w-fit border border-[var(--line2)] px-4 text-[12px] font-medium uppercase tracking-[.06em] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            + Agregar módulo
          </button>
        </div>
      </div>
    </div>
  );
}

function ModulosAprobada({ code }: { code: string }) {
  const [modulos, setModulos] = useState<ModuleRowLite[]>([]);
  const [cargado, setCargado] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("modules")
      .select("id, numero, titulo")
      .eq("course_code", code)
      .order("numero")
      .then(({ data }) => {
        setModulos((data as ModuleRowLite[] | null) ?? []);
        setCargado(true);
      });
  }, [code]);

  async function agregar() {
    if (!nuevoTitulo.trim()) return;
    setAgregando(true);
    const supabase = createClient();
    const numero = (modulos[modulos.length - 1]?.numero ?? 0) + 1;
    const { data, error } = await supabase
      .from("modules")
      .insert({ course_code: code, numero, titulo: nuevoTitulo.trim() })
      .select("id, numero, titulo")
      .single();
    setAgregando(false);
    if (!error && data) {
      setModulos((prev) => [...prev, data as ModuleRowLite]);
      setNuevoTitulo("");
    }
  }

  async function borrar(id: number) {
    const supabase = createClient();
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (!error) setModulos((prev) => prev.filter((m) => m.id !== id));
  }

  async function renombrar(id: number, titulo: string) {
    const supabase = createClient();
    await supabase.from("modules").update({ titulo }).eq("id", id);
  }

  if (!cargado) return <p className="text-[12.5px] text-[var(--faint)]">Cargando módulos…</p>;

  return (
    <div className="mt-3">
      <div className="flex flex-col gap-px bg-[var(--line)]">
        {modulos.length === 0 && (
          <div className="bg-[var(--surface2)] px-3 py-2.5 text-[12.5px] text-[var(--faint)]">
            Todavía no cargaste módulos.
          </div>
        )}
        {modulos.map((m) => (
          <div key={m.id} className="flex items-center gap-2 bg-[var(--surface2)] px-3 py-2.5">
            <span className="shrink-0 text-[12px] text-[var(--faint)]">#{m.numero}</span>
            <input
              className="flex-1 border-0 bg-transparent text-[13px] text-[var(--text)] focus:outline-none"
              defaultValue={m.titulo}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value && value !== m.titulo) renombrar(m.id, value);
              }}
            />
            <button
              onClick={() => borrar(m.id)}
              className="shrink-0 text-[11px] uppercase tracking-[.06em] text-[var(--faint)] hover:text-[var(--danger)]"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className={inputClass}
          placeholder="Título del nuevo módulo"
          value={nuevoTitulo}
          onChange={(e) => setNuevoTitulo(e.target.value)}
        />
        <button
          onClick={agregar}
          disabled={agregando || !nuevoTitulo.trim()}
          className="h-10 shrink-0 border border-[var(--line2)] px-4 text-[12px] font-medium uppercase tracking-[.06em] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Agregar
        </button>
      </div>
    </div>
  );
}

async function fetchModulos(code: string): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase.from("modules").select("titulo").eq("course_code", code).order("numero");
  return (data ?? []).map((m) => m.titulo as string);
}

function PropuestaCard({
  course,
  verticales,
  onActualizado,
}: {
  course: Course;
  verticales: string[];
  onActualizado: (code: string, cambios: Partial<Course>) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<EstructuraForm | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function empezarEdicion() {
    const modulos = await fetchModulos(course.code);
    setForm(formDeCurso(course, modulos));
    setEditando(true);
  }

  async function reenviar() {
    if (!form) return;
    setError(null);
    setGuardando(true);
    const res = await fetch(`/api/docente/propuestas/${course.code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: form.titulo,
        descripcion: form.descripcion,
        vertical: form.vertical,
        modalidad: form.modalidad,
        duracion: form.duracion,
        clasesTotales: form.modalidad === "cohorte" ? Number(form.clasesTotales) : undefined,
        modulos: form.modulos,
      }),
    });
    const data = await res.json().catch(() => null);
    setGuardando(false);
    if (!res.ok) {
      setError(data?.error ?? "No se pudo reenviar la propuesta");
      return;
    }
    onActualizado(course.code, {
      titulo: form.titulo,
      desc: form.descripcion,
      vertical: form.vertical,
      modalidad: form.modalidad,
      duracion: form.duracion,
      clasesTotales: form.modalidad === "cohorte" ? Number(form.clasesTotales) : null,
      estado: "propuesta",
      motivoRechazo: null,
    });
    setEditando(false);
  }

  const badge =
    course.estado === "propuesta"
      ? { label: "Esperando revisión", color: "var(--accent)" }
      : course.estado === "rechazada"
      ? { label: "Rechazada", color: "var(--danger)" }
      : { label: "Aprobada — cargá el contenido", color: "var(--good)" };

  return (
    <div className="border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[.1em]" style={{ color: badge.color }}>
            {badge.label}
          </div>
          <h3 className="mt-1 text-[17px] font-medium">{course.titulo}</h3>
          <p className="mt-1 text-[13px] text-[var(--dim)]">
            {course.code} · {course.vertical}
          </p>
        </div>
        {course.estado === "rechazada" && !editando && (
          <button
            onClick={empezarEdicion}
            className="h-9 shrink-0 border border-[var(--line2)] px-4 text-[12px] font-medium uppercase tracking-[.06em] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Editar y reenviar
          </button>
        )}
      </div>

      {course.estado === "rechazada" && course.motivoRechazo && !editando && (
        <p className="mt-3 border-l-[3px] border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-2.5 text-[13px] text-[var(--danger)]">
          {course.motivoRechazo}
        </p>
      )}

      {editando && form && (
        <div className="mt-4">
          <EstructuraFields form={form} setForm={setForm} verticales={verticales} />
          {error && <p className="mt-3 text-[13px] text-[var(--danger)]">{error}</p>}
          <div className="mt-4 flex gap-3">
            <button
              onClick={reenviar}
              disabled={guardando}
              className="h-10 bg-[var(--accent)] px-5 text-[12.5px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando ? "Reenviando…" : "Reenviar a revisión"}
            </button>
            <button
              onClick={() => setEditando(false)}
              className="h-10 px-4 text-[12.5px] text-[var(--faint)] hover:text-[var(--text)]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {course.estado === "aprobada" && (
        <div className="mt-4">
          <p className="text-[13px] text-[var(--dim)]">
            {formatARS(course.precio)} · {course.fecha === "Inmediato" ? "Ingreso inmediato" : `Inicio ${course.fecha}`}
          </p>
          <div className={`${labelClass} mt-3`}>Contenido del curso</div>
          <ModulosAprobada code={course.code} />
        </div>
      )}
    </div>
  );
}

export function PropuestasDocente({
  propuestas,
  verticales,
  onNuevaPropuesta,
  onActualizarPropuesta,
}: {
  propuestas: Course[];
  verticales: string[];
  onNuevaPropuesta: (course: Course) => void;
  onActualizarPropuesta: (code: string, cambios: Partial<Course>) => void;
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<EstructuraForm>(() => formVacio(verticales[0] ?? ""));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    setError(null);
    setEnviando(true);
    const res = await fetch("/api/docente/propuestas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: form.titulo,
        descripcion: form.descripcion,
        vertical: form.vertical,
        modalidad: form.modalidad,
        duracion: form.duracion,
        clasesTotales: form.modalidad === "cohorte" ? Number(form.clasesTotales) : undefined,
        modulos: form.modulos,
      }),
    });
    const data = await res.json().catch(() => null);
    setEnviando(false);
    if (!res.ok) {
      setError(data?.error ?? "No se pudo mandar la propuesta");
      return;
    }
    onNuevaPropuesta({
      code: data.code,
      titulo: form.titulo,
      desc: form.descripcion,
      vertical: form.vertical,
      modalidad: form.modalidad,
      duracion: form.duracion,
      clasesTotales: form.modalidad === "cohorte" ? Number(form.clasesTotales) : null,
      precio: 0,
      fecha: "A definir",
      docente: "",
      pagoTipo: "pct",
      pagoValor: 35,
      comision: 6.2,
      vendidos: 0,
      vistas: 0,
      estado: "propuesta",
    });
    setForm(formVacio(verticales[0] ?? ""));
    setMostrarForm(false);
  }

  const puedeEnviar =
    form.titulo.trim().length >= 5 &&
    form.descripcion.trim().length >= 20 &&
    form.vertical &&
    form.duracion.trim() &&
    (form.modalidad !== "cohorte" || Number(form.clasesTotales) > 0);

  return (
    <div className="border-t-2 border-[var(--line)] px-[34px] py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-medium">Proponer y gestionar cursos</h2>
          <p className="mt-1 text-[13px] text-[var(--dim)]">
            Mandá la estructura de un curso nuevo para que administración la apruebe.
          </p>
        </div>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="h-10 shrink-0 bg-[var(--accent)] px-5 text-[12.5px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)]"
        >
          {mostrarForm ? "Cancelar" : "+ Proponer curso nuevo"}
        </button>
      </div>

      {mostrarForm && (
        <div className="mt-5 border border-[var(--line2)] bg-[var(--surface)] p-5">
          <EstructuraFields form={form} setForm={setForm} verticales={verticales} />
          {error && <p className="mt-3 text-[13px] text-[var(--danger)]">{error}</p>}
          <button
            onClick={enviar}
            disabled={enviando || !puedeEnviar}
            className="mt-4 h-10 bg-[var(--accent)] px-5 text-[12.5px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? "Enviando…" : "Mandar a revisión"}
          </button>
        </div>
      )}

      {propuestas.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          {propuestas.map((c) => (
            <PropuestaCard key={c.code} course={c} verticales={verticales} onActualizado={onActualizarPropuesta} />
          ))}
        </div>
      )}
    </div>
  );
}
