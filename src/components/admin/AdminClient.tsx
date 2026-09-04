"use client";

import { useState } from "react";
import type { AuditEntry, Course, Enrollment, EstadoMatricula, Receipt } from "@/lib/types";
import { COURSES0, ENROLL0, QUEUE0 } from "@/lib/fixtures";
import { ESTADOS, POOL } from "@/lib/business";
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

const AHORA = new Intl.DateTimeFormat("es-AR").format(new Date());

type Snapshot = { queue: Receipt[]; enroll: Enrollment[] };

export function AdminClient({ tab }: { tab: AdminTab }) {
  const [courses, setCourses] = useState<Course[]>(COURSES0);
  const [enroll, setEnroll] = useState<Enrollment[]>(ENROLL0);
  const [queue, setQueue] = useState<Receipt[]>(QUEUE0);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  const [editor, setEditor] = useState<"new" | "edit" | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [fichaId, setFichaId] = useState<number | null>(null);
  const [dialog, setDialog] = useState<{ code: string; alumnos: number } | null>(null);
  const [toast, setToast] = useState<{ msg: string; snap?: Snapshot } | null>(null);

  function flash(msg: string, snap?: Snapshot) {
    setToast({ msg, snap });
    window.setTimeout(() => setToast(null), snap ? 7000 : 3200);
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

  function saveCourse(course: Course, origCode: string | null) {
    if (!origCode) {
      setCourses((cs) => cs.concat(course));
      flash("Curso creado");
    } else {
      setCourses((cs) => cs.map((c) => (c.code === origCode ? course : c)));
      setEnroll((es) => es.map((e) => (e.code === origCode ? { ...e, code: course.code } : e)));
      flash("Curso actualizado — las cuotas congeladas no cambian");
    }
    closeEditor();
  }

  function requestDelete(course: Course) {
    setDialog({ code: course.code, alumnos: enroll.filter((e) => e.code === course.code).length });
  }

  function confirmDelete() {
    if (!dialog) return;
    const code = dialog.code;
    setCourses((cs) => cs.filter((c) => c.code !== code));
    setEnroll((es) => es.filter((e) => e.code !== code));
    setDialog(null);
    flash(`Curso ${code} eliminado`);
  }

  function assignStudent(name: string) {
    if (!editingCourse) return;
    const course = editor === "edit" ? editingCourse : null;
    if (!course) return;
    const ini = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
    const nuevo: Enrollment = {
      id: Date.now(),
      nombre: name,
      ini,
      code: course.code,
      cuota: course.precio,
      desde: AHORA,
      estado: "activa",
      pago: AHORA,
      medio: "Mercado Pago",
      prog: "0%",
    };
    setEnroll((es) => es.concat(nuevo));
    flash(`${name} asignado con cuota ${course.precio}`);
  }

  function removeStudent(id: number) {
    const student = enroll.find((e) => e.id === id);
    setEnroll((es) => es.filter((e) => e.id !== id));
    if (student) flash(`${student.nombre} quitado del curso`);
  }

  function approve(r: Receipt) {
    setQueue((q) => q.filter((x) => x.id !== r.id));
    setEnroll((es) => es.map((e) => (e.nombre === r.alumno ? { ...e, estado: "activa" } : e)));
    flash(`Pago aprobado — matrícula activa: ${r.alumno}`);
  }

  function reject(r: Receipt) {
    setQueue((q) => q.filter((x) => x.id !== r.id));
    flash(`Comprobante rechazado: ${r.alumno}`);
  }

  function approveAll() {
    if (!queue.length) return;
    const snap: Snapshot = { queue, enroll };
    const names = new Set(queue.map((q) => q.alumno));
    setEnroll((es) => es.map((e) => (names.has(e.nombre) ? { ...e, estado: "activa" } : e)));
    setQueue([]);
    flash(`${queue.length} comprobantes aprobados de una vez.`, snap);
  }

  function undo() {
    if (!toast?.snap) return;
    setQueue(toast.snap.queue);
    setEnroll(toast.snap.enroll);
    setToast(null);
    flash("Listo, lo deshice.");
  }

  function changeEstado(id: number, estado: EstadoMatricula) {
    const e = enroll.find((x) => x.id === id);
    if (!e || e.estado === estado) return;
    const nota = `${ESTADOS[e.estado].label} → ${ESTADOS[estado].label} · Matías Miró · ${AHORA}`;
    setEnroll((es) => es.map((x) => (x.id === id ? { ...x, estado } : x)));
    setAudit((a) => a.concat({ id, txt: nota }));
    flash(`${e.nombre}: ${nota}`);
  }

  function toggleMora(id: number) {
    const e = enroll.find((x) => x.id === id);
    if (!e) return;
    const next: EstadoMatricula = e.estado === "mora" ? "activa" : "mora";
    setEnroll((es) => es.map((x) => (x.id === id ? { ...x, estado: next } : x)));
    flash(next === "mora" ? `${e.nombre} pasó a mora — su acceso queda pausado` : `Mora levantada: ${e.nombre}`);
  }

  function updatePrice(id: number) {
    const e = enroll.find((x) => x.id === id);
    if (!e) return;
    const course = courses.find((c) => c.code === e.code);
    if (!course) return;
    setEnroll((es) => es.map((x) => (x.id === id ? { ...x, cuota: course.precio, desde: AHORA } : x)));
    flash(`Cuota de ${e.nombre} actualizada a ${course.precio}`);
  }

  const fichaEnrollment = fichaId ? enroll.find((e) => e.id === fichaId) ?? null : null;
  const editingEnrolled = editingCourse ? enroll.filter((e) => e.code === editingCourse.code) : [];
  const pool = POOL.filter(
    (p) => !editingCourse || !enroll.some((e) => e.nombre === p && e.code === editingCourse.code)
  );

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
        mode={editor}
        initialCourse={editingCourse}
        courses={courses}
        enrolled={editingEnrolled}
        pool={pool}
        onClose={closeEditor}
        onSave={saveCourse}
        onAssign={assignStudent}
        onRemoveStudent={removeStudent}
      />

      <FichaDrawer
        enrollment={fichaEnrollment}
        audit={audit}
        onClose={() => setFichaId(null)}
        onUpdatePrice={updatePrice}
        onToggleMora={toggleMora}
      />

      <DeleteDialog target={dialog} onCancel={() => setDialog(null)} onConfirm={confirmDelete} />

      <Toast message={toast?.msg ?? null} onUndo={toast?.snap ? undo : undefined} />
    </div>
  );
}
