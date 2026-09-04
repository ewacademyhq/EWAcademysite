import type { Course, Enrollment } from "@/lib/types";
import { formatARS } from "@/lib/format";

export function CursosTab({
  courses,
  enroll,
  onEdit,
  onDelete,
}: {
  courses: Course[];
  enroll: Enrollment[];
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
}) {
  return (
    <div className="px-[34px] py-6">
      <p className="mb-4 text-[12.5px] text-[var(--faint)]">
        Editable: precio, docente, módulos y alumnos asignados.
      </p>
      <div className="overflow-x-auto border border-[var(--line)] bg-[var(--surface)]">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[2.1fr_.8fr_.9fr_.6fr_.8fr_auto] gap-4 border-b border-[var(--line)] px-6 py-3 text-[11px] font-medium uppercase tracking-[.08em] text-[var(--faint)]">
            <span>Curso</span>
            <span>Modalidad</span>
            <span>Docente</span>
            <span>Alumnos</span>
            <span>Precio</span>
            <span className="justify-self-end">Acciones</span>
          </div>
          {courses.map((c, i) => (
            <div
              key={c.code}
              className={`grid grid-cols-[2.1fr_.8fr_.9fr_.6fr_.8fr_auto] items-center gap-4 px-6 py-3.5 text-[13px] ${
                i !== courses.length - 1 ? "border-b border-[var(--line)]" : ""
              }`}
            >
              <div>
                <div>{c.titulo}</div>
                <div className="mt-0.5 text-[12px] text-[var(--faint)]">
                  {c.code} · {c.vertical}
                </div>
              </div>
              <span className="text-[var(--dim)]">
                {c.modalidad === "cohorte" ? "Cohorte" : "Autogest."}
              </span>
              <span className="text-[var(--dim)]">{c.docente}</span>
              <span>{enroll.filter((e) => e.code === c.code).length}</span>
              <span>{formatARS(c.precio)}</span>
              <div className="flex justify-self-end gap-2">
                <button
                  onClick={() => onEdit(c)}
                  className="h-8 border border-[var(--line2)] px-3 text-[11.5px] font-medium uppercase tracking-[.06em] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(c)}
                  className="h-8 border border-[var(--line2)] px-3 text-[11.5px] font-medium uppercase tracking-[.06em] text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
