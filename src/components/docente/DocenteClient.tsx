"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Course, CourseSession, Enrollment, Receipt } from "@/lib/types";
import type { FacturaRow, Liquidacion } from "@/lib/data/docente";
import { createClient } from "@/lib/supabase/client";
import { formatARS } from "@/lib/format";
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

/** ISO completo -> valor local para `<input type="datetime-local">`. */
function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "2026-10-01" -> "octubre 2026". Manipula el string directo (no `Date`) para no correrse de mes por huso horario. */
function periodoLabel(periodo: string) {
  const [yyyy, mm] = periodo.split("-");
  return `${MESES[Number(mm) - 1]} ${yyyy}`;
}

export function DocenteClient({
  docente,
  docenteId,
  courses,
  enrollments,
  queue,
  sessions,
  liquidacion,
  facturas,
}: {
  docente: string;
  docenteId: string;
  courses: Course[];
  enrollments: Enrollment[];
  queue: Receipt[];
  sessions: CourseSession[];
  liquidacion: Liquidacion;
  facturas: FacturaRow[];
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
  const [editingSesionId, setEditingSesionId] = useState<number | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editFecha, setEditFecha] = useState("");
  const [editMeetUrl, setEditMeetUrl] = useState("");
  const [facturasState, setFacturasState] = useState(facturas);
  const [facturaFile, setFacturaFile] = useState<File | null>(null);
  const [subiendoFactura, setSubiendoFactura] = useState(false);
  const facturaInputRef = useRef<HTMLInputElement>(null);
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
    if (new Date(nuevaFecha) <= new Date()) {
      flash("La fecha de la clase tiene que ser futura");
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

  function empezarReprogramar(s: CourseSession) {
    setEditingSesionId(s.id);
    setEditTitulo(s.titulo);
    setEditFecha(toDatetimeLocalValue(s.fecha));
    setEditMeetUrl(s.meetUrl);
  }

  async function reprogramarSesion(id: number) {
    if (!editTitulo.trim() || !editFecha) {
      flash("Completá título y fecha para reprogramar la clase");
      return;
    }
    if (new Date(editFecha) <= new Date()) {
      flash("La fecha de la clase tiene que ser futura");
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("course_sessions")
      .update({
        titulo: editTitulo.trim(),
        fecha: new Date(editFecha).toISOString(),
        meet_url: editMeetUrl.trim(),
      })
      .eq("id", id)
      .select("id, course_code, titulo, fecha, meet_url")
      .single();

    if (error || !data) {
      flash(`No se pudo reprogramar la clase: ${error?.message ?? "error desconocido"}`);
      return;
    }

    setSessionsState((prev) =>
      prev
        .map((s) =>
          s.id === id
            ? { id: data.id, courseCode: data.course_code, titulo: data.titulo, fecha: data.fecha, meetUrl: data.meet_url }
            : s
        )
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
    );
    setEditingSesionId(null);

    const fechaLabel = new Date(data.fecha).toLocaleString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    // Best-effort: si falla el aviso por mail no queremos romper el flujo de
    // reprogramar, que ya quedó guardado en la base.
    fetch("/api/email/clase-reprogramada", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseCode: data.course_code, titulo: data.titulo, fechaLabel }),
    }).catch(() => {});

    flash("Clase reprogramada. Los alumnos van a ver la nueva fecha al entrar al curso.");
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

  async function subirFactura() {
    if (!facturaFile) return;
    setSubiendoFactura(true);
    const supabase = createClient();
    const path = `${docenteId}/${liquidacion.periodo}-${facturaFile.name}`;

    const { error: uploadError } = await supabase.storage
      .from("facturas")
      .upload(path, facturaFile, { upsert: true });
    if (uploadError) {
      setSubiendoFactura(false);
      flash(`No se pudo subir la factura: ${uploadError.message}`);
      return;
    }

    const { data, error: dbError } = await supabase
      .from("facturas")
      .upsert(
        { docente_id: docenteId, periodo: liquidacion.periodo, monto: liquidacion.total, archivo_url: path },
        { onConflict: "docente_id,periodo" }
      )
      .select("id, periodo, monto, archivo_url, estado, subido_at")
      .single();

    setSubiendoFactura(false);

    if (dbError || !data) {
      flash(`No se pudo registrar la factura: ${dbError?.message ?? "error desconocido"}`);
      return;
    }

    setFacturasState((prev) => {
      const resto = prev.filter((f) => f.periodo !== data.periodo);
      return [
        { id: data.id, periodo: data.periodo, monto: Number(data.monto), archivoUrl: data.archivo_url, estado: data.estado, subidoAt: data.subido_at },
        ...resto,
      ].sort((a, b) => b.periodo.localeCompare(a.periodo));
    });
    setFacturaFile(null);
    flash("Factura subida");
  }

  async function verFactura(path: string) {
    // Abrimos la pestaña ya en el click (no después del await) para que el
    // navegador no lo trate como popup no solicitado y lo bloquee.
    const nuevaPestana = window.open("", "_blank", "noopener,noreferrer");
    const supabase = createClient();
    const { data, error } = await supabase.storage.from("facturas").createSignedUrl(path, 3600);
    if (error || !data) {
      nuevaPestana?.close();
      flash(`No se pudo abrir la factura: ${error?.message ?? "error desconocido"}`);
      return;
    }
    if (nuevaPestana) nuevaPestana.location.href = data.signedUrl;
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
              if (editingSesionId === a.id) {
                return (
                  <div key={a.id} className="flex flex-col gap-2 border border-[var(--line2)] bg-[var(--surface2)] p-3">
                    <input
                      value={editTitulo}
                      onChange={(e) => setEditTitulo(e.target.value)}
                      placeholder="Título"
                      className="h-9 border border-[var(--line2)] bg-[var(--surface)] px-2.5 text-[13px]"
                    />
                    <input
                      type="datetime-local"
                      value={editFecha}
                      onChange={(e) => setEditFecha(e.target.value)}
                      className="h-9 border border-[var(--line2)] bg-[var(--surface)] px-2.5 text-[13px]"
                    />
                    <input
                      value={editMeetUrl}
                      onChange={(e) => setEditMeetUrl(e.target.value)}
                      placeholder="Link de Google Meet (opcional)"
                      className="h-9 border border-[var(--line2)] bg-[var(--surface)] px-2.5 text-[13px]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => reprogramarSesion(a.id)}
                        className="h-9 flex-1 bg-[var(--accent)] text-[12px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] hover:bg-[var(--accent-600)]"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingSesionId(null)}
                        className="h-9 px-3 text-[12px] text-[var(--faint)] hover:text-[var(--text)]"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                );
              }

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
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <button
                      onClick={() => empezarReprogramar(a)}
                      className="text-[11px] font-medium uppercase tracking-[.06em] text-[var(--faint)] hover:text-[var(--accent)]"
                    >
                      Reprogramar
                    </button>
                    <button
                      onClick={() => cancelarSesion(a.id)}
                      className="text-[11px] font-medium uppercase tracking-[.06em] text-[var(--faint)] hover:text-[var(--danger)]"
                    >
                      Cancelar
                    </button>
                  </div>
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

        <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            Facturación — {periodoLabel(liquidacion.periodo)}
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <div
                className="font-bold text-[var(--text)]"
                style={{ fontFamily: "var(--font-humane)", fontSize: "48px", lineHeight: 0.85 }}
              >
                {formatARS(liquidacion.total)}
              </div>
              <p className="mt-2 text-[13px] text-[var(--dim)]">
                Te corresponde este mes, según tus cursos y alumnos activos.
              </p>
              <div className="mt-4 flex flex-col gap-px bg-[var(--line)]">
                {liquidacion.cursos.map((c) => (
                  <div
                    key={c.code}
                    className="flex items-center justify-between bg-[var(--surface)] px-4 py-2.5 text-[13px]"
                  >
                    <span>
                      {c.code} · {c.alumnos} {c.alumnos === 1 ? "alumno" : "alumnos"} ×{" "}
                      {formatARS(c.pagoPorAlumno)}
                    </span>
                    <span className="font-medium">{formatARS(c.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              {(() => {
                const facturaDelMes = facturasState.find((f) => f.periodo === liquidacion.periodo);
                if (facturaDelMes) {
                  return (
                    <div className="border border-[var(--line2)] bg-[var(--surface2)] p-4">
                      <div className="text-[13px]">
                        Factura de este mes subida ·{" "}
                        <span style={{ color: facturaDelMes.estado === "pagada" ? "var(--good)" : "var(--accent)" }}>
                          {facturaDelMes.estado === "pagada" ? "Pagada" : "Pendiente de pago"}
                        </span>
                      </div>
                      <button
                        onClick={() => verFactura(facturaDelMes.archivoUrl)}
                        className="mt-3 h-9 border border-[var(--line2)] px-4 text-[12px] font-medium uppercase tracking-[.06em] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        Ver archivo
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="flex items-center justify-between gap-4 border border-dashed border-[var(--line2)] px-4 py-4">
                    <div>
                      <div className="text-[13px] text-[var(--text)]">
                        {facturaFile ? facturaFile.name : "Subí tu factura del mes"}
                      </div>
                      <div className="mt-1 text-[11px] uppercase tracking-[.08em] text-[var(--faint)]">
                        PDF, JPG o PNG
                      </div>
                    </div>
                    <input
                      ref={facturaInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => setFacturaFile(e.target.files?.[0] ?? null)}
                    />
                    {facturaFile ? (
                      <button
                        onClick={subirFactura}
                        disabled={subiendoFactura}
                        className="h-9 shrink-0 bg-[var(--accent)] px-4 text-[12px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {subiendoFactura ? "Subiendo…" : "Confirmar"}
                      </button>
                    ) : (
                      <button
                        onClick={() => facturaInputRef.current?.click()}
                        className="h-9 shrink-0 border border-[var(--line2)] px-4 text-[12px] font-medium uppercase tracking-[.06em] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        Elegir archivo
                      </button>
                    )}
                  </div>
                );
              })()}

              {facturasState.length > 0 && (
                <div className="mt-4 flex flex-col gap-1.5">
                  <div className="text-[11px] font-medium uppercase tracking-[.08em] text-[var(--faint)]">
                    Historial
                  </div>
                  {facturasState.slice(0, 6).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => verFactura(f.archivoUrl)}
                      className="flex items-center justify-between text-left text-[12.5px] text-[var(--dim)] hover:text-[var(--accent)]"
                    >
                      <span>{periodoLabel(f.periodo)}</span>
                      <span>{formatARS(f.monto)} · {f.estado === "pagada" ? "Pagada" : "Pendiente"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Toast message={toast} />
    </div>
  );
}
