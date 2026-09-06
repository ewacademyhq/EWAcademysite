"use client";

import { useEffect, useState } from "react";
import type { AuditEntry, Course, Enrollment, EstadoMatricula, Receipt } from "@/lib/types";
import type { PersonOption } from "@/lib/data/admin";
import { ESTADOS } from "@/lib/business";
import { isoToDMY, initials, todayISO } from "@/lib/date";
import { formatARS } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { KpiTab } from "@/components/admin/tabs/KpiTab";
import { PagosTab } from "@/components/admin/tabs/PagosTab";
import { CursosTab } from "@/components/admin/tabs/CursosTab";
import { MatriculasTab } from "@/components/admin/tabs/MatriculasTab";
import { EconomiaTab } from "@/components/admin/tabs/EconomiaTab";
import { CourseEditorDrawer } from "@/components/admin/CourseEditorDrawer";
import { FichaDrawer } from "@/components/admin/FichaDrawer";
import { DeleteDialog } from "@/components/admin/DeleteDialog";
import { Toast } from "@/components/ui/Toast";

export type AdminTab = "kpi" | "pagos" | "cursos" | "matriculas" | "economia";

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
    duracion: c.duracion,
    docente_id: c.docenteId ?? null,
    pago_tipo: c.pagoTipo,
    pago_valor: c.pagoValor,
    comision: c.comision,
    mora_tipo: c.moraTipo ?? "pct",
    mora_valor: c.moraValor ?? 5,
    vendidos: c.vendidos,
    vistas: c.vistas,
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
  alumnos,
  adminId,
  adminNombre,
}: {
  tab: AdminTab;
  initialCourses: Course[];
  initialEnrollments: Enrollment[];
  initialQueue: Receipt[];
  docentes: PersonOption[];
  alumnos: PersonOption[];
  adminId: string;
  adminNombre: string;
}) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [enroll, setEnroll] = useState<Enrollment[]>(initialEnrollments);
  const [queue, setQueue] = useState<Receipt[]>(initialQueue);

  const [editor, setEditor] = useState<"new" | "edit" | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [fichaId, setFichaId] = useState<number | null>(null);
  const [fichaHistorial, setFichaHistorial] = useState<AuditEntry[]>([]);
  const [dialog, setDialog] = useState<{ code: string; alumnos: number } | null>(null);
  const [toast, setToast] = useState<{ msg: string; snap?: Snapshot } | null>(null);

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
      .select("de, a, at, usuario:users!usuario_id(nombre)")
      .eq("entity", "enrollment")
      .eq("entity_id", String(fichaId))
      .order("at", { ascending: false })
      .then(({ data }) => {
        if (cancelled || !data) return;
        setFichaHistorial(
          (data as Array<{
            de: string;
            a: string;
            at: string;
            usuario: { nombre: string } | { nombre: string }[] | null;
          }>).map((row) => {
            const u = row.usuario;
            const usuarioNombre = Array.isArray(u) ? u[0]?.nombre : u?.nombre;
            const deLabel = ESTADOS[row.de as EstadoMatricula]?.label ?? row.de;
            const aLabel = ESTADOS[row.a as EstadoMatricula]?.label ?? row.a;
            return {
              id: fichaId,
              txt: `${deLabel} → ${aLabel} · ${usuarioNombre ?? "—"} · ${new Date(row.at).toLocaleString("es-AR")}`,
            };
          })
        );
      });
    return () => {
      cancelled = true;
    };
  }, [fichaId]);

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

  async function saveCourse(course: Course, origCode: string | null) {
    const supabase = createClient();
    const row = courseToRow(course);

    if (!origCode) {
      const { error } = await supabase.from("courses").insert(row);
      if (error) {
        flash(`No se pudo crear el curso: ${error.message}`);
        return;
      }
      setCourses((cs) => cs.concat(course));
      flash("Curso creado");
    } else {
      const { error } = await supabase.from("courses").update(row).eq("code", origCode);
      if (error) {
        flash(`No se pudo actualizar el curso: ${error.message}`);
        return;
      }
      setCourses((cs) => cs.map((c) => (c.code === origCode ? course : c)));
      flash("Curso actualizado — las cuotas congeladas no cambian");
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

  async function assignStudent(person: PersonOption) {
    if (!editingCourse) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        user_id: person.id,
        course_code: editingCourse.code,
        cuota_congelada: editingCourse.precio,
        estado: "activa",
        medio: "Mercado Pago",
        progreso: 0,
      })
      .select("id")
      .single();

    if (error || !data) {
      flash(`No se pudo asignar: ${error?.message ?? "error desconocido"}`);
      return;
    }

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
      medio: "Mercado Pago",
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
      .update({ estado: "activa" })
      .eq("id", r.enrollmentId);
    if (e2) {
      flash(`No se pudo activar la matrícula: ${e2.message}`);
      return;
    }
    setQueue((q) => q.filter((x) => x.id !== r.id));
    setEnroll((es) => es.map((e) => (e.id === r.enrollmentId ? { ...e, estado: "activa" } : e)));
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
      .update({ estado: "activa" })
      .in("id", enrollmentIds);
    if (e2) {
      flash(`No se pudo activar las matrículas: ${e2.message}`);
      return;
    }

    setEnroll((es) => es.map((e) => (enrollmentIds.includes(e.id) ? { ...e, estado: "activa" } : e)));
    setQueue([]);
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

  function toggleMora(id: number) {
    const e = enroll.find((x) => x.id === id);
    if (!e) return;
    changeEstado(id, e.estado === "mora" ? "activa" : "mora");
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

  const fichaEnrollment = fichaId ? enroll.find((e) => e.id === fichaId) ?? null : null;
  const fichaCourse = fichaEnrollment ? courses.find((c) => c.code === fichaEnrollment.code) ?? null : null;
  const editingEnrolled = editingCourse ? enroll.filter((e) => e.code === editingCourse.code) : [];
  const pool = editingCourse
    ? alumnos.filter((p) => !editingEnrolled.some((e) => e.userId === p.id))
    : [];

  return (
    <div>
      <AdminHeader onNewCourse={openNewCourse} />

      {tab === "kpi" && <KpiTab courses={courses} enroll={enroll} />}
      {tab === "pagos" && (
        <PagosTab
          queue={queue}
          enroll={enroll}
          onView={(r) => flash(`Vista previa de ${r.archivo}`)}
          onApprove={approve}
          onReject={reject}
          onApproveAll={approveAll}
          onOpenFicha={setFichaId}
        />
      )}
      {tab === "cursos" && (
        <CursosTab courses={courses} enroll={enroll} onEdit={openEditCourse} onDelete={requestDelete} />
      )}
      {tab === "matriculas" && (
        <MatriculasTab
          enroll={enroll}
          onChangeEstado={changeEstado}
          onToggleMora={toggleMora}
          onOpenFicha={setFichaId}
        />
      )}
      {tab === "economia" && <EconomiaTab courses={courses} enroll={enroll} />}

      <CourseEditorDrawer
        key={`${editor}-${editingCourse?.code ?? "new"}`}
        mode={editor}
        initialCourse={editingCourse}
        courses={courses}
        docentes={docentes}
        enrolled={editingEnrolled}
        pool={pool}
        onClose={closeEditor}
        onSave={saveCourse}
        onAssign={assignStudent}
        onRemoveStudent={removeStudent}
      />

      <FichaDrawer
        enrollment={fichaEnrollment}
        course={fichaCourse}
        historial={fichaHistorial.map((h) => h.txt)}
        onClose={() => setFichaId(null)}
        onUpdatePrice={updatePrice}
        onToggleMora={toggleMora}
      />

      <DeleteDialog target={dialog} onCancel={() => setDialog(null)} onConfirm={confirmDelete} />

      <Toast message={toast?.msg ?? null} onUndo={toast?.snap ? undo : undefined} />
    </div>
  );
}
