"use client";

import { useEffect, useState } from "react";
import type { AuditEntry, Course, Enrollment, EstadoMatricula, PagoTipo, Receipt } from "@/lib/types";
import type { DocenteConCursos, PersonOption, VerticalOption } from "@/lib/data/admin";
import type { ModuleRow } from "@/lib/data/mycourse";
import { ALLOWED_TRANSITIONS, ESTADOS } from "@/lib/business";
import { isoToDMY, initials, todayISO } from "@/lib/date";
import { formatARS } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { KpiTab } from "@/components/admin/tabs/KpiTab";
import { PagosTab } from "@/components/admin/tabs/PagosTab";
import { CursosTab } from "@/components/admin/tabs/CursosTab";
import { PropuestasTab } from "@/components/admin/tabs/PropuestasTab";
import { MatriculasTab } from "@/components/admin/tabs/MatriculasTab";
import { EconomiaTab } from "@/components/admin/tabs/EconomiaTab";
import { DocentesTab } from "@/components/admin/tabs/DocentesTab";
import { CourseEditorDrawer } from "@/components/admin/CourseEditorDrawer";
import { VerticalesDrawer } from "@/components/admin/VerticalesDrawer";
import { FichaDrawer } from "@/components/admin/FichaDrawer";
import { DeleteDialog } from "@/components/admin/DeleteDialog";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Toast } from "@/components/ui/Toast";

export type AdminTab = "kpi" | "pagos" | "cursos" | "propuestas" | "matriculas" | "economia" | "docentes";

type Snapshot = { queue: Receipt[]; enroll: Enrollment[] };

function courseToRow(c: Course) {
  return {
    code: c.code,
    vertical: c.vertical,
    modalidad: c.modalidad,
    titulo: c.titulo,
    descripcion: c.desc,
    precio: c.precio,
    fecha_inicio: c.modalidad === "cohorte" ? isoFromDMY(c.fecha) : null,
    fecha_fin: c.modalidad === "cohorte" ? c.fechaFin ?? null : null,
    duracion: c.duracion,
    docente_id: c.docenteId ?? null,
    pago_tipo: c.pagoTipo,
    pago_valor: c.pagoValor,
    comision: c.comision,
    clases_totales: c.modalidad === "cohorte" ? c.clasesTotales ?? null : null,
    vendidos: c.vendidos,
    vistas: c.vistas,
    imagen_url: c.imagenUrl ?? null,
    cupo_maximo: c.cupoMaximo ?? null,
    cupo_minimo: c.modalidad === "cohorte" ? c.cupoMinimo ?? null : null,
    drive_folder_url: c.driveFolderUrl ?? null,
    estado: c.estado,
  };
}

function isoFromDMY(dmy: string): string | null {
  const match = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

export function AdminClient({
  tab,
  initialCourses,
  initialEnrollments,
  initialQueue,
  docentes,
  docentesConCursos,
  alumnos,
  verticales,
  adminId,
  adminNombre,
}: {
  tab: AdminTab;
  initialCourses: Course[];
  initialEnrollments: Enrollment[];
  initialQueue: Receipt[];
  docentes: PersonOption[];
  docentesConCursos: DocenteConCursos[];
  alumnos: PersonOption[];
  verticales: VerticalOption[];
  adminId: string;
  adminNombre: string;
}) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [enroll, setEnroll] = useState<Enrollment[]>(initialEnrollments);
  const [queue, setQueue] = useState<Receipt[]>(initialQueue);
  const [docentesOptions, setDocentesOptions] = useState<PersonOption[]>(docentes);
  const [docentesList, setDocentesList] = useState<DocenteConCursos[]>(docentesConCursos);
  const [verticalesOptions, setVerticalesOptions] = useState<VerticalOption[]>(verticales);

  const [editor, setEditor] = useState<"new" | "edit" | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [fichaId, setFichaId] = useState<number | null>(null);
  const [fichaHistorial, setFichaHistorial] = useState<AuditEntry[]>([]);
  const [dialog, setDialog] = useState<{ code: string; alumnos: number } | null>(null);
  const [confirmApproveAll, setConfirmApproveAll] = useState(false);
  const [toast, setToast] = useState<{ msg: string; snap?: Snapshot } | null>(null);
  const [courseModules, setCourseModules] = useState<ModuleRow[]>([]);
  const [verticalesDrawerOpen, setVerticalesDrawerOpen] = useState(false);

  function flash(msg: string, snap?: Snapshot) {
    setToast({ msg, snap });
    window.setTimeout(() => setToast(null), snap ? 7000 : 3200);
  }

  // Trae el historial de auditoría real de la matrícula cuando se abre la ficha.
  useEffect(() => {
    if (!fichaId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("audit_log")
      .select("de, a, at, nota, usuario:users!usuario_id(nombre)")
      .eq("entity", "enrollment")
      .eq("entity_id", String(fichaId))
      .order("at", { ascending: false })
      .then(({ data }) => {
        if (cancelled || !data) return;
        setFichaHistorial(
          (data as Array<{
            de: string | null;
            a: string;
            at: string;
            nota: string | null;
            usuario: { nombre: string } | { nombre: string }[] | null;
          }>).map((row) => {
            const u = row.usuario;
            const usuarioNombre = Array.isArray(u) ? u[0]?.nombre : u?.nombre;
            const deLabel = row.de ? ESTADOS[row.de as EstadoMatricula]?.label ?? row.de : null;
            const aLabel = ESTADOS[row.a as EstadoMatricula]?.label ?? row.a;
            const cambio = deLabel ? `${deLabel} → ${aLabel}` : aLabel;
            return {
              id: fichaId,
              txt: `${cambio} · ${usuarioNombre ?? "Sistema (automático)"} · ${new Date(row.at).toLocaleString("es-AR")}${row.nota ? ` · "${row.nota}"` : ""}`,
            };
          })
        );
      });
    return () => {
      cancelled = true;
    };
  }, [fichaId]);

  // Trae los módulos reales del curso que se está editando.
  useEffect(() => {
    if (!editingCourse) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("modules")
      .select("id, numero, titulo, orden")
      .eq("course_code", editingCourse.code)
      .order("orden")
      .then(({ data }) => {
        if (!cancelled) setCourseModules(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [editingCourse]);

  async function addModule(titulo: string) {
    if (!editingCourse) return;
    const numero = courseModules.length ? Math.max(...courseModules.map((m) => m.numero)) + 1 : 1;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("modules")
      .insert({ course_code: editingCourse.code, numero, titulo, orden: numero })
      .select("id, numero, titulo, orden")
      .single();

    if (error || !data) {
      flash(`No se pudo agregar el módulo: ${error?.message ?? "error desconocido"}`);
      return;
    }
    setCourseModules((ms) => ms.concat(data).sort((a, b) => a.orden - b.orden));
    flash("Módulo agregado");
  }

  async function renameModule(id: number, titulo: string) {
    const supabase = createClient();
    const { error } = await supabase.from("modules").update({ titulo }).eq("id", id);
    if (error) {
      flash(`No se pudo renombrar el módulo: ${error.message}`);
      return;
    }
    setCourseModules((ms) => ms.map((m) => (m.id === id ? { ...m, titulo } : m)));
  }

  async function removeModule(id: number) {
    const supabase = createClient();
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (error) {
      flash(`No se pudo eliminar el módulo: ${error.message}`);
      return;
    }
    setCourseModules((ms) => ms.filter((m) => m.id !== id));
    flash("Módulo eliminado");
  }

  function openNewCourse() {
    setEditingCourse(null);
    setEditor("new");
  }

  function openEditCourse(course: Course) {
    setEditingCourse(course);
    setEditor("edit");
  }

  function closeEditor() {
    setEditor(null);
    setEditingCourse(null);
  }

  async function crearCarpetaDrive(code: string): Promise<string | null> {
    try {
      const res = await fetch("/api/drive/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseCode: code }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        flash(data?.error ?? "No se pudo crear la carpeta de Drive");
        return null;
      }
      return data.url as string;
    } catch {
      flash("No se pudo crear la carpeta de Drive");
      return null;
    }
  }

  async function crearCarpetaDriveManual(code: string): Promise<string | null> {
    const url = await crearCarpetaDrive(code);
    if (url) {
      setCourses((cs) => cs.map((c) => (c.code === code ? { ...c, driveFolderUrl: url } : c)));
      flash("Carpeta de Drive creada");
    }
    return url;
  }

  async function saveCourse(course: Course, origCode: string | null) {
    const supabase = createClient();
    const row = courseToRow(course);

    if (!origCode) {
      const { error } = await supabase.from("courses").insert(row);
      if (error) {
        flash(`No se pudo crear el curso: ${error.message}`);
        return;
      }
      let created = course;
      if (!course.driveFolderUrl) {
        const url = await crearCarpetaDrive(course.code);
        if (url) created = { ...course, driveFolderUrl: url };
      }
      setCourses((cs) => cs.concat(created));
      flash("Curso creado");
    } else {
      const { error } = await supabase.from("courses").update(row).eq("code", origCode);
      if (error) {
        flash(`No se pudo actualizar el curso: ${error.message}`);
        return;
      }
      setCourses((cs) => cs.map((c) => (c.code === origCode ? course : c)));
      flash("Curso actualizado — lo que ya pagaron los matriculados no cambia");
    }
    closeEditor();
  }

  function requestDelete(course: Course) {
    setDialog({ code: course.code, alumnos: enroll.filter((e) => e.code === course.code).length });
  }

  async function confirmDelete() {
    if (!dialog) return;
    const code = dialog.code;
    const supabase = createClient();
    const { error } = await supabase.from("courses").delete().eq("code", code);
    if (error) {
      flash(`No se pudo eliminar: ${error.message}`);
      setDialog(null);
      return;
    }
    setCourses((cs) => cs.filter((c) => c.code !== code));
    setEnroll((es) => es.filter((e) => e.code !== code));
    setDialog(null);
    flash(`Curso ${code} eliminado`);
  }

  async function assignStudent(person: PersonOption, motivo: string) {
    if (!editingCourse) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        user_id: person.id,
        course_code: editingCourse.code,
        cuota_congelada: editingCourse.precio,
        estado: "activa",
        medio: "Manual",
        progreso: 0,
      })
      .select("id")
      .single();

    if (error || !data) {
      flash(`No se pudo asignar: ${error?.message ?? "error desconocido"}`);
      return;
    }

    // No hubo pago real (ni fila en payments/receipts) — el motivo queda en
    // la auditoría para que se vea en la ficha del alumno por qué está activa.
    await supabase.from("audit_log").insert({
      entity: "enrollment",
      entity_id: String(data.id),
      de: null,
      a: "activa (asignación manual)",
      usuario_id: adminId,
      nota: motivo,
    });

    const nuevo: Enrollment = {
      id: data.id,
      userId: person.id,
      nombre: person.nombre,
      ini: initials(person.nombre),
      code: editingCourse.code,
      cuota: editingCourse.precio,
      desde: isoToDMY(todayISO()),
      estado: "activa",
      pago: "—",
      medio: "Manual",
      prog: "0%",
    };
    setEnroll((es) => es.concat(nuevo));
    flash(`${person.nombre} asignado con cuota ${formatARS(editingCourse.precio)}`);
  }

  async function removeStudent(id: number) {
    const student = enroll.find((e) => e.id === id);
    const supabase = createClient();
    const { error } = await supabase.from("enrollments").delete().eq("id", id);
    if (error) {
      flash(`No se pudo quitar: ${error.message}`);
      return;
    }
    setEnroll((es) => es.filter((e) => e.id !== id));
    if (student) flash(`${student.nombre} quitado del curso`);
  }

  async function approve(r: Receipt) {
    const supabase = createClient();
    const nowIso = new Date().toISOString();
    const hoy = todayISO();
    const { error: e1 } = await supabase
      .from("receipts")
      .update({ estado: "aprobado", revisado_por: adminId, revisado_at: nowIso })
      .eq("id", r.id);
    if (e1) {
      flash(`No se pudo aprobar: ${e1.message}`);
      return;
    }
    const { error: e2 } = await supabase
      .from("enrollments")
      .update({ estado: "activa", ultimo_pago_at: hoy })
      .eq("id", r.enrollmentId);
    if (e2) {
      flash(`No se pudo activar la matrícula: ${e2.message}`);
      return;
    }
    await supabase.from("payments").insert({
      enrollment_id: r.enrollmentId,
      periodo: hoy,
      monto: Number(r.monto.replace(/[^0-9]/g, "")),
      medio: "Transferencia",
      estado: "acreditado",
      acreditado_at: nowIso,
    });
    setQueue((q) => q.filter((x) => x.id !== r.id));
    setEnroll((es) =>
      es.map((e) => (e.id === r.enrollmentId ? { ...e, estado: "activa", pago: isoToDMY(hoy) } : e))
    );
    // Best-effort: si falla el mail no queremos romper la aprobación, que ya quedó guardada.
    fetch("/api/email/matricula-confirmada", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollmentId: r.enrollmentId }),
    }).catch(() => {});
    flash(`Pago aprobado — matrícula activa: ${r.alumno}`);
  }

  async function reject(r: Receipt) {
    const supabase = createClient();
    const { error } = await supabase
      .from("receipts")
      .update({ estado: "rechazado", revisado_por: adminId, revisado_at: new Date().toISOString() })
      .eq("id", r.id);
    if (error) {
      flash(`No se pudo rechazar: ${error.message}`);
      return;
    }
    setQueue((q) => q.filter((x) => x.id !== r.id));
    flash(`Comprobante rechazado: ${r.alumno}`);
  }

  async function approveAll() {
    if (!queue.length) return;
    const snap: Snapshot = { queue, enroll };
    const supabase = createClient();
    const receiptIds = queue.map((q) => q.id);
    const enrollmentIds = queue.map((q) => q.enrollmentId);
    const nowIso = new Date().toISOString();
    const hoy = todayISO();

    const { error: e1 } = await supabase
      .from("receipts")
      .update({ estado: "aprobado", revisado_por: adminId, revisado_at: nowIso })
      .in("id", receiptIds);
    if (e1) {
      flash(`No se pudo aprobar todo: ${e1.message}`);
      return;
    }
    const { error: e2 } = await supabase
      .from("enrollments")
      .update({ estado: "activa", ultimo_pago_at: hoy })
      .in("id", enrollmentIds);
    if (e2) {
      flash(`No se pudo activar las matrículas: ${e2.message}`);
      return;
    }

    await supabase.from("payments").insert(
      queue.map((q) => ({
        enrollment_id: q.enrollmentId,
        periodo: hoy,
        monto: Number(q.monto.replace(/[^0-9]/g, "")),
        medio: "Transferencia" as const,
        estado: "acreditado",
        acreditado_at: nowIso,
      }))
    );

    setEnroll((es) =>
      es.map((e) =>
        enrollmentIds.includes(e.id) ? { ...e, estado: "activa", pago: isoToDMY(hoy) } : e
      )
    );
    setQueue([]);
    for (const id of enrollmentIds) {
      fetch("/api/email/matricula-confirmada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: id }),
      }).catch(() => {});
    }
    flash(`${queue.length} comprobantes aprobados de una vez.`, snap);
  }

  async function undo() {
    if (!toast?.snap) return;
    const { snap } = toast;
    const supabase = createClient();
    await supabase
      .from("receipts")
      .update({ estado: "pendiente", revisado_por: null, revisado_at: null })
      .in("id", snap.queue.map((q) => q.id));
    await Promise.all(
      snap.enroll
        .filter((e) => snap.queue.some((q) => q.enrollmentId === e.id))
        .map((e) => supabase.from("enrollments").update({ estado: e.estado }).eq("id", e.id))
    );
    setQueue(snap.queue);
    setEnroll(snap.enroll);
    setToast(null);
    flash("Listo, lo deshice.");
  }

  async function changeEstado(id: number, estado: EstadoMatricula) {
    const e = enroll.find((x) => x.id === id);
    if (!e || e.estado === estado) return;
    // Defensa en profundidad: la regla real la impone el trigger de la base
    // (supabase/migrations/0013_estado_transiciones.sql); esto solo evita el
    // viaje al server para un cambio que de todos modos va a rechazar.
    if (!ALLOWED_TRANSITIONS[e.estado].includes(estado)) {
      flash(`No se puede pasar de ${ESTADOS[e.estado].label} a ${ESTADOS[estado].label} directamente.`);
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("enrollments").update({ estado }).eq("id", id);
    if (error) {
      flash(`No se pudo cambiar el estado: ${error.message}`);
      return;
    }
    await supabase
      .from("audit_log")
      .insert({ entity: "enrollment", entity_id: String(id), de: e.estado, a: estado, usuario_id: adminId });
    setEnroll((es) => es.map((x) => (x.id === id ? { ...x, estado } : x)));
    flash(`${e.nombre}: ${ESTADOS[e.estado].label} → ${ESTADOS[estado].label} · ${adminNombre}`);
  }

  async function forceEstado(id: number, estado: EstadoMatricula, nota: string) {
    const e = enroll.find((x) => x.id === id);
    if (!e) return;
    const supabase = createClient();
    const { error } = await supabase.rpc("force_estado_change", {
      p_enrollment_id: id,
      p_nuevo_estado: estado,
      p_nota: nota,
    });
    if (error) {
      flash(`No se pudo forzar el cambio: ${error.message}`);
      return;
    }
    setEnroll((es) => es.map((x) => (x.id === id ? { ...x, estado } : x)));
    flash(`${e.nombre}: ${ESTADOS[e.estado].label} → ${ESTADOS[estado].label} (corrección forzada) · ${adminNombre}`);
  }

  async function marcarContenidoActualizado(code: string) {
    const supabase = createClient();
    const nowIso = new Date().toISOString();
    const { error } = await supabase.from("courses").update({ contenido_actualizado_at: nowIso }).eq("code", code);
    if (error) {
      flash(`No se pudo marcar como actualizado: ${error.message}`);
      return;
    }
    setCourses((cs) => cs.map((c) => (c.code === code ? { ...c, contenidoActualizadoAt: nowIso } : c)));
    setEditingCourse((c) => (c && c.code === code ? { ...c, contenidoActualizadoAt: nowIso } : c));
    flash("Curso marcado como actualizado");
  }

  async function aprobarPropuesta(
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
  ): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from("courses")
      .update({
        precio: terminos.precio,
        comision: terminos.comision,
        pago_tipo: terminos.pagoTipo,
        pago_valor: terminos.pagoValor,
        cupo_maximo: terminos.cupoMaximo,
        cupo_minimo: terminos.cupoMinimo,
        fecha_inicio: terminos.fechaInicioIso,
        fecha_fin: terminos.fechaFinIso,
        estado: "aprobada",
      })
      .eq("code", code);
    if (error) {
      flash(`No se pudo aprobar la propuesta: ${error.message}`);
      return false;
    }
    setCourses((cs) =>
      cs.map((c) =>
        c.code === code
          ? {
              ...c,
              precio: terminos.precio,
              comision: terminos.comision,
              pagoTipo: terminos.pagoTipo,
              pagoValor: terminos.pagoValor,
              cupoMaximo: terminos.cupoMaximo,
              cupoMinimo: terminos.cupoMinimo,
              fecha: terminos.fechaInicioIso ? isoToDMY(terminos.fechaInicioIso) : "A definir",
              fechaFin: terminos.fechaFinIso,
              estado: "aprobada",
            }
          : c
      )
    );
    flash(`Propuesta de ${code} aprobada — el docente ya puede cargar el contenido`);
    return true;
  }

  async function rechazarPropuesta(code: string, motivo: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from("courses")
      .update({ estado: "rechazada", motivo_rechazo: motivo })
      .eq("code", code);
    if (error) {
      flash(`No se pudo rechazar la propuesta: ${error.message}`);
      return false;
    }
    setCourses((cs) =>
      cs.map((c) => (c.code === code ? { ...c, estado: "rechazada", motivoRechazo: motivo } : c))
    );
    flash(`Propuesta de ${code} rechazada`);
    return true;
  }

  async function publicarCurso(code: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from("courses").update({ estado: "publicado" }).eq("code", code);
    if (error) {
      flash(`No se pudo publicar: ${error.message}`);
      return false;
    }
    setCourses((cs) => cs.map((c) => (c.code === code ? { ...c, estado: "publicado" } : c)));
    flash(`${code} publicado en el catálogo`);
    return true;
  }

  /**
   * Mueve las matrículas sin progreso del curso origen al destino (consolidar
   * dos comisiones que no llegaron al mínimo). Solo se mueven las que tienen
   * 0% — si alguien ya arrancó a cursar en el origen, se queda ahí. Si el
   * origen queda en 0 alumnos después del movimiento, se marca
   * `pendiente_borrado` para que aparezca el aviso en Cursos.
   */
  async function unificarCurso(origenCode: string, destinoCode: string): Promise<boolean> {
    const destino = courses.find((c) => c.code === destinoCode);
    if (!destino) {
      flash("No se encontró el curso destino");
      return false;
    }

    const candidatos = enroll.filter((e) => e.code === origenCode && parseInt(e.prog, 10) === 0);
    if (candidatos.length === 0) {
      flash("No hay alumnos sin progreso para mover en ese curso");
      return false;
    }

    const inscriptosDestino = enroll.filter((e) => e.code === destinoCode).length;
    if (destino.cupoMaximo && inscriptosDestino + candidatos.length > destino.cupoMaximo) {
      flash(
        `Mover ${candidatos.length} alumnos superaría el cupo máximo de ${destino.code} (${destino.cupoMaximo})`
      );
      return false;
    }

    const supabase = createClient();
    const ids = candidatos.map((e) => e.id);
    const { error } = await supabase.from("enrollments").update({ course_code: destinoCode }).in("id", ids);
    if (error) {
      flash(`No se pudo reasignar a los alumnos: ${error.message}`);
      return false;
    }

    const quedanEnOrigen = enroll.filter((e) => e.code === origenCode).length - candidatos.length;
    if (quedanEnOrigen === 0) {
      const { error: flagError } = await supabase
        .from("courses")
        .update({ pendiente_borrado: true })
        .eq("code", origenCode);
      if (flagError) flash(`Se reasignó, pero no se pudo marcar ${origenCode}: ${flagError.message}`);
      setCourses((cs) => cs.map((c) => (c.code === origenCode ? { ...c, pendienteBorrado: true } : c)));
    }

    setEnroll((es) => es.map((e) => (ids.includes(e.id) ? { ...e, code: destinoCode } : e)));
    flash(`${candidatos.length} alumnos reasignados de ${origenCode} a ${destinoCode}`);
    return true;
  }

  async function updatePrice(id: number) {
    const e = enroll.find((x) => x.id === id);
    if (!e) return;
    const course = courses.find((c) => c.code === e.code);
    if (!course) return;
    const supabase = createClient();
    const desde = todayISO();
    const { error } = await supabase
      .from("enrollments")
      .update({ cuota_congelada: course.precio, congelada_desde: desde })
      .eq("id", id);
    if (error) {
      flash(`No se pudo actualizar la cuota: ${error.message}`);
      return;
    }
    setEnroll((es) =>
      es.map((x) => (x.id === id ? { ...x, cuota: course.precio, desde: isoToDMY(desde) } : x))
    );
    flash(`Cuota de ${e.nombre} actualizada a ${formatARS(course.precio)}`);
  }

  async function createDocente(email: string, nombre: string): Promise<boolean> {
    const res = await fetch("/api/admin/docentes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nombre }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      flash(`No se pudo dar de alta: ${json.error ?? "error desconocido"}`);
      return false;
    }
    setDocentesList((ds) => ds.concat({ id: json.id, nombre, email, activo: true, cursos: [], ultimaFactura: null }));
    setDocentesOptions((ds) => ds.concat({ id: json.id, nombre }));
    flash(`${nombre} dado de alta — le llega una invitación por correo.`);
    return true;
  }

  async function crearVertical(nombre: string, prefijo: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from("verticales").insert({ nombre, prefijo });
    if (error) {
      flash(`No se pudo crear la vertical: ${error.message}`);
      return false;
    }
    setVerticalesOptions((vs) => vs.concat({ nombre, prefijo }).sort((a, b) => a.nombre.localeCompare(b.nombre)));
    flash(`Vertical "${nombre}" creada`);
    return true;
  }

  async function editarVertical(nombreActual: string, nombreNuevo: string, prefijoNuevo: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from("verticales")
      .update({ nombre: nombreNuevo, prefijo: prefijoNuevo })
      .eq("nombre", nombreActual);
    if (error) {
      flash(`No se pudo editar la vertical: ${error.message}`);
      return false;
    }
    setVerticalesOptions((vs) =>
      vs
        .map((v) => (v.nombre === nombreActual ? { nombre: nombreNuevo, prefijo: prefijoNuevo } : v))
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
    );
    if (nombreActual !== nombreNuevo) {
      setCourses((cs) => cs.map((c) => (c.vertical === nombreActual ? { ...c, vertical: nombreNuevo } : c)));
    }
    flash(`Vertical actualizada`);
    return true;
  }

  async function borrarVertical(nombre: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from("verticales").delete().eq("nombre", nombre);
    if (error) {
      flash(`No se pudo borrar la vertical: ${error.message}`);
      return false;
    }
    setVerticalesOptions((vs) => vs.filter((v) => v.nombre !== nombre));
    flash(`Vertical "${nombre}" eliminada`);
    return true;
  }

  async function marcarFacturaPagada(docenteId: string, facturaId: number) {
    const supabase = createClient();
    const { error } = await supabase.from("facturas").update({ estado: "pagada" }).eq("id", facturaId);
    if (error) {
      flash(`No se pudo marcar la factura como pagada: ${error.message}`);
      return;
    }
    await supabase.from("audit_log").insert({
      entity: "factura",
      entity_id: String(facturaId),
      de: "pendiente",
      a: "pagada",
      usuario_id: adminId,
    });
    setDocentesList((ds) =>
      ds.map((d) =>
        d.id === docenteId && d.ultimaFactura
          ? { ...d, ultimaFactura: { ...d.ultimaFactura, estado: "pagada" } }
          : d
      )
    );
    flash("Factura marcada como pagada");
  }

  async function toggleDocenteActivo(id: string, activo: boolean) {
    const res = await fetch("/api/admin/docentes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, activo }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      flash(`No se pudo actualizar: ${json.error ?? "error desconocido"}`);
      return;
    }
    const docente = docentesList.find((d) => d.id === id);
    setDocentesList((ds) => ds.map((d) => (d.id === id ? { ...d, activo } : d)));
    setDocentesOptions((ds) => {
      if (activo) {
        return docente && !ds.some((x) => x.id === id) ? ds.concat({ id, nombre: docente.nombre }) : ds;
      }
      return ds.filter((x) => x.id !== id);
    });
    flash(activo ? "Docente reactivado" : "Docente dado de baja");
  }

  const fichaEnrollment = fichaId ? enroll.find((e) => e.id === fichaId) ?? null : null;
  const fichaCourse = fichaEnrollment ? courses.find((c) => c.code === fichaEnrollment.code) ?? null : null;
  const editingEnrolled = editingCourse ? enroll.filter((e) => e.code === editingCourse.code) : [];
  const pool = editingCourse
    ? alumnos.filter((p) => !editingEnrolled.some((e) => e.userId === p.id))
    : [];

  return (
    <div>
      <AdminHeader onNewCourse={openNewCourse} onManageVerticales={() => setVerticalesDrawerOpen(true)} />

      {tab === "kpi" && <KpiTab courses={courses} enroll={enroll} />}
      {tab === "pagos" && (
        <PagosTab
          queue={queue}
          enroll={enroll}
          onView={(r) => flash(`Vista previa de ${r.archivo}`)}
          onApprove={approve}
          onReject={reject}
          onApproveAll={() => setConfirmApproveAll(true)}
          onOpenFicha={setFichaId}
        />
      )}
      {tab === "cursos" && (
        <CursosTab
          courses={courses}
          enroll={enroll}
          onEdit={openEditCourse}
          onDelete={requestDelete}
          onUnificar={unificarCurso}
        />
      )}
      {tab === "propuestas" && (
        <PropuestasTab
          courses={courses}
          onAprobar={aprobarPropuesta}
          onRechazar={rechazarPropuesta}
          onPublicar={publicarCurso}
        />
      )}
      {tab === "matriculas" && (
        <MatriculasTab
          enroll={enroll}
          courses={courses}
          onChangeEstado={changeEstado}
          onForceEstado={forceEstado}
          onOpenFicha={setFichaId}
        />
      )}
      {tab === "economia" && <EconomiaTab courses={courses} enroll={enroll} />}
      {tab === "docentes" && (
        <DocentesTab
          docentes={docentesList}
          onCreate={createDocente}
          onToggleActivo={toggleDocenteActivo}
          onMarcarFacturaPagada={marcarFacturaPagada}
        />
      )}

      <CourseEditorDrawer
        key={`${editor}-${editingCourse?.code ?? "new"}`}
        mode={editor}
        initialCourse={editingCourse}
        courses={courses}
        docentes={docentesOptions}
        verticales={verticalesOptions}
        enrolled={editingEnrolled}
        pool={pool}
        modules={courseModules}
        onClose={closeEditor}
        onSave={saveCourse}
        onAssign={assignStudent}
        onCreateVertical={crearVertical}
        onMarkUpdated={marcarContenidoActualizado}
        onCreateDriveFolder={crearCarpetaDriveManual}
        onRemoveStudent={removeStudent}
        onAddModule={addModule}
        onRenameModule={renameModule}
        onRemoveModule={removeModule}
      />

      <FichaDrawer
        enrollment={fichaEnrollment}
        course={fichaCourse}
        historial={fichaHistorial.map((h) => h.txt)}
        onClose={() => setFichaId(null)}
        onUpdatePrice={updatePrice}
      />

      <DeleteDialog target={dialog} onCancel={() => setDialog(null)} onConfirm={confirmDelete} />

      <VerticalesDrawer
        open={verticalesDrawerOpen}
        verticales={verticalesOptions}
        courses={courses}
        onClose={() => setVerticalesDrawerOpen(false)}
        onCreate={crearVertical}
        onEdit={editarVertical}
        onDelete={borrarVertical}
      />

      <ConfirmDialog
        open={confirmApproveAll}
        title="¿Aprobar todos los comprobantes?"
        message={`Se van a aprobar ${queue.length} ${queue.length === 1 ? "comprobante" : "comprobantes"} y activar ${queue.length === 1 ? "su matrícula" : "sus matrículas"}. Los pagos que se generen no se pueden deshacer.`}
        confirmLabel="Aprobar todos"
        onCancel={() => setConfirmApproveAll(false)}
        onConfirm={() => {
          setConfirmApproveAll(false);
          approveAll();
        }}
      />

      <Toast message={toast?.msg ?? null} onUndo={toast?.snap ? undo : undefined} />
    </div>
  );
}
