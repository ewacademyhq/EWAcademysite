"use client";

import { useState } from "react";
import Link from "next/link";
import type { Course, CourseSession, Enrollment, Receipt } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { BackLink } from "@/components/ui/BackLink";
import { StatusChip } from "@/components/ui/StatusChip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Toast } from "@/components/ui/Toast";

function sessionParts(iso: string) {
  const d = new Date(iso);
  return {
    dia: d.toLocaleDateString("es-AR", { day: "2-digit" }),
    mes: d.toLocaleDateString("es-AR", { month: "short" }).replace(".", "").slice(0, 3).toUpperCase(),
    hora: d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export function DocenteClient({
  docente,
  courses,
  enrollments,
  queue,
  sessions,
}: {
  docente: string;
  courses: Course[];
  enrollments: Enrollment[];
  queue: Receipt[];
  sessions: CourseSession[];
}) {
  const [code, setCode] = useState(courses[0]?.code ?? "");
  const [sessionsState, setSessionsState] = useState(sessions);
  const [courseDrafts, setCourseDrafts] = useState(courses);
  const [showForm, setShowForm] = useState(false);
  const [nuevaTitulo, setNuevaTitulo] = useState("");
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevaMeetUrl, setNuevaMeetUrl] = useState("");
  const [driveInput, setDriveInput] = useState("");
  const [editingDrive, setEditingDrive] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }

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
  const agenda = sessionsState.filter((s) => s.courseCode === code);
  const currentCourse = courseDrafts.find((c) => c.code === code);

  async function crearSesion() {
    if (!nuevaTitulo.trim() || !nuevaFecha) {
      flash("Completá título y fecha para agendar la clase");
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("course_sessions")
      .insert({
        course_code: code,
        titulo: nuevaTitulo.trim(),
        fecha: new Date(nuevaFecha).toISOString(),
        meet_url: nuevaMeetUrl.trim(),
      })
      .select("id, course_code, titulo, fecha, meet_url")
      .single();

    if (error || !data) {
      flash(`No se pudo agendar la clase: ${error?.message ?? "error desconocido"}`);
      return;
    }

    setSessionsState((prev) =>
      [
        ...prev,
        { id: data.id, courseCode: data.course_code, titulo: data.titulo, fecha: data.fecha, meetUrl: data.meet_url },
      ].sort((a, b) => a.fecha.localeCompare(b.fecha))
    );
    setNuevaTitulo("");
    setNuevaFecha("");
    setNuevaMeetUrl("");
    setShowForm(false);
    flash("Clase agendada");
  }

  async function cancelarSesion(id: number) {
    const supabase = createClient();
    const { error } = await supabase.from("course_sessions").delete().eq("id", id);
    if (error) {
      flash(`No se pudo cancelar la clase: ${error.message}`);
      return;
    }
    setSessionsState((prev) => prev.filter((s) => s.id !== id));
    flash("Clase cancelada");
  }

  async function guardarDrive() {
    const supabase = createClient();
    const { error } = await supabase.rpc("set_my_course_drive_folder", {
      p_code: code,
      p_url: driveInput.trim(),
    });
    if (error) {
      flash(`No se pudo vincular la carpeta: ${error.message}`);
      return;
    }
    setCourseDrafts((prev) =>
      prev.map((c) => (c.code === code ? { ...c, driveFolderUrl: driveInput.trim() || null } : c))
    );
    setEditingDrive(false);
    flash("Carpeta de Drive vinculada");
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
              Panel docente
            </h1>
            <p className="mt-2 text-[13.5px] text-[var(--dim)]">
              {docente} · {courses.length}{" "}
              {courses.length === 1 ? "curso a cargo" : "cursos a cargo"} ·{" "}
              {totalAlumnos} alumnos
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex h-11 items-center bg-[var(--accent)] px-5 text-[13px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-600)]"
          >
            {showForm ? "Cancelar" : "Programar clase"}
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

        {showForm && (
          <div className="mt-5 flex flex-wrap items-end gap-3 border border-[var(--line2)] bg-[var(--surface)] p-4">
            <label className="flex flex-col gap-1 text-[12px] text-[var(--faint)]">
              Título
              <input
                value={nuevaTitulo}
                onChange={(e) => setNuevaTitulo(e.target.value)}
                placeholder="Ej. Repaso de módulo 2"
                className="h-10 w-56 border border-[var(--line2)] bg-[var(--surface)] px-3 text-[13px]"
              />
            </label>
            <label className="flex flex-col gap-1 text-[12px] text-[var(--faint)]">
              Fecha y hora
              <input
                type="datetime-local"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                className="h-10 border border-[var(--line2)] bg-[var(--surface)] px-3 text-[13px]"
              />
            </label>
            <label className="flex flex-col gap-1 text-[12px] text-[var(--faint)]">
              Link de Google Meet (opcional)
              <input
                value={nuevaMeetUrl}
                onChange={(e) => setNuevaMeetUrl(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="h-10 w-64 border border-[var(--line2)] bg-[var(--surface)] px-3 text-[13px]"
              />
            </label>
            <button
              onClick={crearSesion}
              className="h-10 bg-[var(--accent)] px-5 text-[12.5px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] hover:bg-[var(--accent-600)]"
            >
              Agendar
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4 px-[34px] py-6">
        <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] lg:col-span-8">
          <div className="border-b border-[var(--line)] px-6 py-4 text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            Alumnos — {code}
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
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
            </div>
          </div>
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
            {agenda.length === 0 && (
              <p className="text-[13px] text-[var(--faint)]">
                Sin clases agendadas. Usá &quot;Programar clase&quot; para
                cargar la próxima.
              </p>
            )}
            {agenda.map((a) => {
              const { dia, mes, hora } = sessionParts(a.fecha);
              return (
                <div key={a.id} className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="text-center">
                      <div
                        className="font-bold text-[var(--text)]"
                        style={{ fontFamily: "var(--font-humane)", fontSize: "30px", lineHeight: 0.9 }}
                      >
                        {dia}
                      </div>
                      <div className="text-[10.5px] uppercase tracking-[.08em] text-[var(--faint)]">
                        {mes}
                      </div>
                    </div>
                    <div>
                      <div className="text-[13.5px]">{a.titulo}</div>
                      <div className="mt-1 text-[12px] text-[var(--faint)]">
                        {hora} · {code}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => cancelarSesion(a.id)}
                    className="shrink-0 text-[11px] font-medium uppercase tracking-[.06em] text-[var(--faint)] hover:text-[var(--danger)]"
                  >
                    Cancelar
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] p-6 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
              Material en Drive
            </div>
            {!editingDrive && (
              <button
                onClick={() => {
                  setDriveInput(currentCourse?.driveFolderUrl ?? "");
                  setEditingDrive(true);
                }}
                className="h-9 border border-[var(--line2)] px-4 text-[12px] font-medium uppercase tracking-[.06em] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {currentCourse?.driveFolderUrl ? "Editar carpeta" : "Vincular carpeta"}
              </button>
            )}
          </div>

          {editingDrive ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                value={driveInput}
                onChange={(e) => setDriveInput(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="h-10 min-w-0 flex-1 border border-[var(--line2)] bg-[var(--surface)] px-3 text-[13px]"
              />
              <button
                onClick={guardarDrive}
                className="h-10 bg-[var(--accent)] px-5 text-[12.5px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] hover:bg-[var(--accent-600)]"
              >
                Guardar
              </button>
              <button
                onClick={() => setEditingDrive(false)}
                className="h-10 px-3 text-[12.5px] text-[var(--faint)] hover:text-[var(--text)]"
              >
                Cancelar
              </button>
            </div>
          ) : currentCourse?.driveFolderUrl ? (
            <a
              href={currentCourse.driveFolderUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block truncate font-mono text-[13px] text-[var(--accent)] hover:underline"
            >
              {currentCourse.driveFolderUrl} ↗
            </a>
          ) : (
            <p className="mt-4 text-[13px] text-[var(--faint)]">
              Todavía no vinculaste una carpeta de Drive para este curso.
            </p>
          )}
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

      <Toast message={toast} />
    </div>
  );
}
