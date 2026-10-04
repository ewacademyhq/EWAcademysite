"use client";

import { useRef, useState } from "react";
import type { Course, Enrollment, Modalidad, PagoTipo, Vertical } from "@/lib/types";
import { PRECIO_MIN, docentePagoOf, nextCode } from "@/lib/business";
import { formatARS } from "@/lib/format";
import { todayISO } from "@/lib/date";
import { createClient } from "@/lib/supabase/client";
import type { PersonOption, VerticalOption } from "@/lib/data/admin";
import type { ModuleRow } from "@/lib/data/mycourse";

const NUEVA_VERTICAL = "__nueva__";

export interface CourseDraft {
  origCode: string | null;
  titulo: string;
  code: string;
  vertical: Vertical;
  modalidad: Modalidad;
  docenteId: string;
  precio: string;
  comision: string;
  pagoTipo: PagoTipo;
  pagoValor: string;
  moraTipo: "ninguno" | "pct" | "fijo";
  moraValor: string;
  graciaDias: string;
  bolsillo: string;
  margen: string;
  desc: string;
  fecha: string;
  fechaFin: string;
  duracion: string;
  vendidos: number;
  vistas: number;
  imagenUrl: string;
}

function draftFor(course: Course | null, courses: Course[], verticales: VerticalOption[]): CourseDraft {
  if (!course) {
    const primera = verticales[0];
    return {
      origCode: null,
      titulo: "Curso sin título",
      code: primera ? nextCode(primera.prefijo, courses) : "",
      vertical: primera?.nombre ?? "",
      modalidad: "cohorte",
      docenteId: "",
      precio: "80000",
      comision: "6.2",
      pagoTipo: "pct",
      pagoValor: "35",
      moraTipo: "pct",
      moraValor: "5",
      graciaDias: "5",
      bolsillo: "28000",
      margen: "40",
      desc: "Descripción pendiente.",
      fecha: "A definir",
      fechaFin: "",
      duracion: "4 meses",
      vendidos: 0,
      vistas: 0,
      imagenUrl: "",
    };
  }
  return {
    origCode: course.code,
    titulo: course.titulo,
    code: course.code,
    vertical: course.vertical,
    modalidad: course.modalidad,
    docenteId: course.docenteId ?? "",
    precio: String(course.precio),
    comision: String(course.comision),
    pagoTipo: course.pagoTipo,
    pagoValor: String(course.pagoValor),
    moraTipo: course.moraTipo || "pct",
    moraValor: String(course.moraValor ?? 5),
    graciaDias: String(course.graciaDias ?? 5),
    bolsillo: String(Math.round(docentePagoOf(course))),
    margen: "40",
    desc: course.desc,
    fecha: course.fecha,
    fechaFin: course.fechaFin ?? "",
    duracion: course.duracion,
    vendidos: course.vendidos,
    vistas: course.vistas,
    imagenUrl: course.imagenUrl ?? "",
  };
}

export function CourseEditorDrawer({
  mode,
  initialCourse,
  courses,
  docentes,
  verticales,
  enrolled,
  pool,
  modules,
  onClose,
  onSave,
  onAssign,
  onCreateVertical,
  onRemoveStudent,
  onAddModule,
  onRenameModule,
  onRemoveModule,
}: {
  mode: "new" | "edit" | null;
  initialCourse: Course | null;
  courses: Course[];
  docentes: PersonOption[];
  verticales: VerticalOption[];
  enrolled: Enrollment[];
  pool: PersonOption[];
  modules: ModuleRow[];
  onClose: () => void;
  onSave: (course: Course, origCode: string | null) => void;
  onAssign: (person: PersonOption, motivo: string) => void;
  onCreateVertical: (nombre: string, prefijo: string) => Promise<boolean>;
  onRemoveStudent: (enrollmentId: number) => void;
  onAddModule: (titulo: string) => void;
  onRenameModule: (id: number, titulo: string) => void;
  onRemoveModule: (id: number) => void;
}) {
  // El padre remonta este componente con una `key` distinta cada vez que se
  // abre para un curso distinto (o para "nuevo"), así que el estado inicial
  // alcanza para resetear el formulario sin necesitar un efecto.
  const [draft, setDraft] = useState<CourseDraft>(() => draftFor(initialCourse, courses, verticales));
  const [montoModo, setMontoModo] = useState<"precio" | "bolsillo">("precio");
  const [addPick, setAddPick] = useState("");
  const [addMotivo, setAddMotivo] = useState("");
  const [newModuleTitulo, setNewModuleTitulo] = useState("");
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const imagenInputRef = useRef<HTMLInputElement>(null);
  const [creandoVertical, setCreandoVertical] = useState(false);
  const [nuevaVerticalNombre, setNuevaVerticalNombre] = useState("");
  const [nuevaVerticalPrefijo, setNuevaVerticalPrefijo] = useState("");
  const [guardandoVertical, setGuardandoVertical] = useState(false);

  if (!mode) return null;

  function patch<K extends keyof CourseDraft>(key: K, value: CourseDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function subirImagen(file: File) {
    setSubiendoImagen(true);
    const supabase = createClient();
    const path = `${draft.code || "sin-codigo"}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("cursos").upload(path, file, { upsert: true });
    setSubiendoImagen(false);
    if (error) {
      // No hay toast en este componente — el único feedback de error del
      // drawer hoy es la lista de "errores" de validación, así que se agrega
      // acá como alerta simple en vez de inventar un canal nuevo.
      window.alert(`No se pudo subir la imagen: ${error.message}`);
      return;
    }
    const { data } = supabase.storage.from("cursos").getPublicUrl(path);
    patch("imagenUrl", data.publicUrl);
  }

  const precio = Number(draft.precio) || 0;
  const pagoValor = Number(draft.pagoValor) || 0;
  const comision = Number(draft.comision) || 0;
  const moraValor = Number(draft.moraValor) || 0;
  const graciaDias = Number(draft.graciaDias) || 0;
  const bolsillo = Number(draft.bolsillo) || 0;
  const margen = Number(draft.margen) || 0;
  const minFechaFin = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const pagoDocente = draft.pagoTipo === "pct" ? (precio * pagoValor) / 100 : pagoValor;
  const comisionMonto = (precio * comision) / 100;
  const neto = precio - pagoDocente - comisionMonto;
  const netoPct = precio ? Math.round((neto / precio) * 100) : 0;

  const resto = 1 - (comision + margen) / 100;
  const sugerido = resto > 0 ? bolsillo / resto : 0;

  const errores: string[] = [];
  if (draft.titulo.trim().length < 5) errores.push("El título necesita al menos 5 caracteres.");
  if (!/^[A-Z]+-\d{3}$/.test(draft.code)) errores.push("El código va con formato VERTICAL-000, por ejemplo CIBER-101.");
  if (courses.some((c) => c.code === draft.code && c.code !== draft.origCode)) errores.push("Ese código ya lo usa otro curso.");
  if (precio < PRECIO_MIN) errores.push(`El precio mensual no puede ser menor a ${formatARS(PRECIO_MIN)}.`);
  if (comision < 0 || comision > 15) errores.push("La comisión de pasarela va entre 0% y 15%.");
  if (draft.pagoTipo === "pct" && (pagoValor < 1 || pagoValor > 90)) errores.push("El porcentaje al docente va entre 1% y 90%.");
  if (draft.pagoTipo === "fijo" && (pagoValor < 1 || pagoValor >= precio)) errores.push("El monto fijo al docente tiene que ser mayor a 0 y menor al precio.");
  if (draft.moraTipo !== "ninguno" && moraValor <= 0) errores.push("El recargo por mora tiene que ser mayor a 0.");
  if (graciaDias < 0 || graciaDias > 30) errores.push("Los días de gracia van entre 0 y 30.");
  if (draft.fechaFin && draft.fechaFin <= todayISO()) errores.push("La fecha de fin de cohorte tiene que ser posterior a hoy.");
  if (neto <= 0) errores.push("Con estos valores el neto para la academia queda en cero o negativo.");

  function handleSave() {
    if (errores.length) return;
    const docente = docentes.find((d) => d.id === draft.docenteId);
    const course: Course = {
      code: draft.code,
      titulo: draft.titulo,
      vertical: draft.vertical,
      modalidad: draft.modalidad,
      docente: docente?.nombre ?? "Sin asignar",
      docenteId: draft.docenteId || null,
      precio,
      comision,
      pagoTipo: draft.pagoTipo,
      pagoValor,
      moraTipo: draft.moraTipo,
      moraValor,
      graciaDias,
      fechaFin: draft.modalidad === "cohorte" ? draft.fechaFin || null : null,
      desc: draft.desc,
      fecha: draft.fecha,
      duracion: draft.duracion,
      vendidos: draft.vendidos,
      vistas: draft.vistas,
      imagenUrl: draft.imagenUrl || null,
    };
    onSave(course, draft.origCode);
  }

  function usarSugerido() {
    patch("precio", String(Math.round(sugerido)));
    patch("pagoTipo", "fijo");
    patch("pagoValor", draft.bolsillo);
    setMontoModo("precio");
  }

  const inputClass =
    "h-11 w-full border border-[var(--line2)] bg-[var(--surface)] px-3.5 text-[14.5px] text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-60";
  const labelClass = "text-[11px] font-medium uppercase tracking-[.14em] text-[var(--faint)]";

  return (
    <div className="fixed inset-0 z-[90] flex justify-end" style={{ background: "rgba(14,14,14,.72)" }}>
      <div
        className="flex h-full w-full max-w-[620px] flex-col overflow-y-auto border-l-2 border-[var(--accent)] bg-[var(--bg)]"
        style={{ boxShadow: "var(--shadow)", animation: "slideUp .18s ease" }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg)] px-6 py-5">
          <div>
            <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--accent)]">
              {mode === "new" ? "Nuevo curso" : "Editar curso"}
            </div>
            <div className="mt-1 text-[15px]">{draft.titulo}</div>
          </div>
          <button
            onClick={onClose}
            className="h-9 border border-[var(--line2)] px-4 text-[12px] font-medium uppercase tracking-[.06em] hover:border-[var(--text)]"
          >
            Cerrar
          </button>
        </div>

        <div className="flex flex-col gap-5 p-6">
          <div>
            <label className={labelClass}>Título</label>
            <input
              className={`${inputClass} mt-2`}
              value={draft.titulo}
              onChange={(e) => patch("titulo", e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Imagen del curso</label>
            <div className="mt-2 flex items-center gap-4">
              {draft.imagenUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.imagenUrl}
                  alt=""
                  className="h-16 w-24 shrink-0 border border-[var(--line2)] object-cover"
                />
              ) : (
                <div className="flex h-16 w-24 shrink-0 items-center justify-center border border-dashed border-[var(--line2)] text-[10.5px] text-[var(--faint)]">
                  Sin imagen
                </div>
              )}
              <input
                ref={imagenInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) subirImagen(file);
                }}
              />
              <button
                type="button"
                onClick={() => imagenInputRef.current?.click()}
                disabled={subiendoImagen}
                className="h-9 border border-[var(--line2)] px-4 text-[12px] font-medium uppercase tracking-[.06em] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {subiendoImagen ? "Subiendo…" : draft.imagenUrl ? "Cambiar" : "Subir imagen"}
              </button>
              {draft.imagenUrl && (
                <button
                  type="button"
                  onClick={() => patch("imagenUrl", "")}
                  className="text-[12px] uppercase tracking-[.06em] text-[var(--danger)] hover:underline"
                >
                  Quitar
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Código</label>
              <input
                className={`${inputClass} mt-2 font-mono uppercase`}
                value={draft.code}
                disabled={mode === "edit"}
                onChange={(e) => patch("code", e.target.value.toUpperCase())}
              />
              {mode === "edit" && (
                <p className="mt-1.5 text-[11.5px] text-[var(--faint)]">
                  El código no se puede cambiar una vez creado el curso.
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>Vertical</label>
              <select
                className={`${inputClass} mt-2`}
                value={draft.vertical}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === NUEVA_VERTICAL) {
                    setCreandoVertical(true);
                    return;
                  }
                  const prefijo = verticales.find((x) => x.nombre === v)?.prefijo ?? "";
                  setDraft((d) => ({
                    ...d,
                    vertical: v,
                    code: d.origCode ? d.code : nextCode(prefijo, courses),
                  }));
                }}
              >
                {verticales.map((v) => (
                  <option key={v.nombre} value={v.nombre}>
                    {v.nombre}
                  </option>
                ))}
                <option value={NUEVA_VERTICAL}>+ Nueva vertical…</option>
              </select>
              {creandoVertical && (
                <div className="mt-2 flex flex-col gap-2 border border-[var(--line2)] bg-[var(--surface2)] p-3">
                  <input
                    className={inputClass}
                    placeholder="Nombre (ej: Data)"
                    value={nuevaVerticalNombre}
                    onChange={(e) => setNuevaVerticalNombre(e.target.value)}
                  />
                  <input
                    className={`${inputClass} font-mono uppercase`}
                    placeholder="Prefijo del código (ej: DATA)"
                    value={nuevaVerticalPrefijo}
                    onChange={(e) => setNuevaVerticalPrefijo(e.target.value.toUpperCase())}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!nuevaVerticalNombre.trim() || !/^[A-Z]+$/.test(nuevaVerticalPrefijo) || guardandoVertical}
                      onClick={async () => {
                        setGuardandoVertical(true);
                        const nombre = nuevaVerticalNombre.trim();
                        const prefijo = nuevaVerticalPrefijo;
                        const ok = await onCreateVertical(nombre, prefijo);
                        setGuardandoVertical(false);
                        if (!ok) return;
                        setDraft((d) => ({
                          ...d,
                          vertical: nombre,
                          code: d.origCode ? d.code : nextCode(prefijo, courses),
                        }));
                        setCreandoVertical(false);
                        setNuevaVerticalNombre("");
                        setNuevaVerticalPrefijo("");
                      }}
                      className="h-9 flex-1 bg-[var(--accent)] text-[12px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {guardandoVertical ? "Creando…" : "Crear"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreandoVertical(false);
                        setNuevaVerticalNombre("");
                        setNuevaVerticalPrefijo("");
                      }}
                      className="h-9 px-3 text-[12px] text-[var(--faint)] hover:text-[var(--text)]"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className={labelClass}>Modalidad</label>
              <select
                className={`${inputClass} mt-2`}
                value={draft.modalidad}
                onChange={(e) => patch("modalidad", e.target.value as Modalidad)}
              >
                <option value="cohorte">Cohorte</option>
                <option value="continuo">Autogestionado</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Docente</label>
              <select
                className={`${inputClass} mt-2`}
                value={draft.docenteId}
                onChange={(e) => patch("docenteId", e.target.value)}
              >
                <option value="">Sin asignar</option>
                {docentes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
              {docentes.length === 0 && (
                <p className="mt-1.5 text-[11.5px] text-[var(--faint)]">
                  Todavía no hay ningún usuario con rol docente.
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-px bg-[var(--line)]">
            <button
              onClick={() => setMontoModo("precio")}
              className={`flex-1 py-2.5 text-[12.5px] font-medium uppercase tracking-[.06em] ${
                montoModo === "precio" ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-[var(--surface)] text-[var(--dim)]"
              }`}
            >
              Desde el precio
            </button>
            <button
              onClick={() => setMontoModo("bolsillo")}
              className={`flex-1 py-2.5 text-[12.5px] font-medium uppercase tracking-[.06em] ${
                montoModo === "bolsillo" ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-[var(--surface)] text-[var(--dim)]"
              }`}
            >
              Desde el bolsillo del docente
            </button>
          </div>

          {montoModo === "precio" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Precio mensual (ARS)</label>
                <input
                  className={`${inputClass} mt-2`}
                  value={draft.precio}
                  onChange={(e) => patch("precio", e.target.value.replace(/[^0-9]/g, ""))}
                />
              </div>
              <div>
                <label className={labelClass}>Comisión de pasarela (%)</label>
                <input
                  className={`${inputClass} mt-2`}
                  value={draft.comision}
                  onChange={(e) => patch("comision", e.target.value.replace(/[^0-9.,]/g, "").replace(",", "."))}
                />
              </div>
              <div>
                <label className={labelClass}>Pago al docente</label>
                <select
                  className={`${inputClass} mt-2`}
                  value={draft.pagoTipo}
                  onChange={(e) => {
                    const t = e.target.value as PagoTipo;
                    patch("pagoTipo", t);
                    patch("pagoValor", t === "pct" ? "35" : "20000");
                  }}
                >
                  <option value="pct">Porcentaje del precio</option>
                  <option value="fijo">Monto fijo por alumno</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  {draft.pagoTipo === "pct" ? "Porcentaje al docente (%)" : "Monto fijo por alumno (ARS)"}
                </label>
                <input
                  className={`${inputClass} mt-2`}
                  value={draft.pagoValor}
                  onChange={(e) => patch("pagoValor", e.target.value.replace(/[^0-9.]/g, ""))}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Bolsillo del docente por alumno (ARS)</label>
                <input
                  className={`${inputClass} mt-2`}
                  value={draft.bolsillo}
                  onChange={(e) => patch("bolsillo", e.target.value.replace(/[^0-9]/g, ""))}
                />
              </div>
              <div>
                <label className={labelClass}>Comisión de pasarela (%)</label>
                <input
                  className={`${inputClass} mt-2`}
                  value={draft.comision}
                  onChange={(e) => patch("comision", e.target.value.replace(/[^0-9.,]/g, "").replace(",", "."))}
                />
              </div>
              <div>
                <label className={labelClass}>Margen deseado para la academia (%)</label>
                <input
                  className={`${inputClass} mt-2`}
                  value={draft.margen}
                  onChange={(e) => patch("margen", e.target.value.replace(/[^0-9.]/g, ""))}
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="border border-[var(--line2)] bg-[var(--surface)] px-3.5 py-3 text-[13px]">
                  Precio sugerido:{" "}
                  <strong className="font-medium">{formatARS(resto > 0 ? sugerido : 0)}</strong>
                </div>
              </div>
              <p className="col-span-2 text-[12.5px] leading-[1.5] text-[var(--faint)]">
                {resto > 0
                  ? `Con ${formatARS(bolsillo)} de bolsillo para el docente, ${comision}% de pasarela y ${margen}% de margen para la academia.`
                  : "La comisión más el margen no pueden sumar 100% o más."}
              </p>
              <button
                onClick={usarSugerido}
                disabled={resto <= 0}
                className="col-span-2 h-10 border border-[var(--accent)] text-[12.5px] font-medium uppercase tracking-[.06em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Usar sugerido
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Recargo por mora</label>
              <select
                className={`${inputClass} mt-2`}
                value={draft.moraTipo}
                onChange={(e) => patch("moraTipo", e.target.value as CourseDraft["moraTipo"])}
              >
                <option value="ninguno">Ninguno</option>
                <option value="pct">Porcentaje de la cuota</option>
                <option value="fijo">Monto fijo (ARS)</option>
              </select>
            </div>
            {draft.moraTipo !== "ninguno" && (
              <div>
                <label className={labelClass}>
                  {draft.moraTipo === "fijo" ? "Recargo fijo (ARS)" : "Recargo (% de la cuota)"}
                </label>
                <input
                  className={`${inputClass} mt-2`}
                  value={draft.moraValor}
                  onChange={(e) => patch("moraValor", e.target.value.replace(/[^0-9.]/g, ""))}
                />
              </div>
            )}
            <div>
              <label className={labelClass}>Días de gracia</label>
              <input
                className={`${inputClass} mt-2`}
                value={draft.graciaDias}
                onChange={(e) => patch("graciaDias", e.target.value.replace(/[^0-9]/g, ""))}
              />
              <p className="mt-1.5 text-[11.5px] text-[var(--faint)]">
                Días después del vencimiento (día 10) antes de pasar a mora.
              </p>
            </div>
            {draft.modalidad === "cohorte" && (
              <div>
                <label className={labelClass}>Fin de cohorte</label>
                <input
                  type="date"
                  className={`${inputClass} mt-2`}
                  min={minFechaFin}
                  value={draft.fechaFin}
                  onChange={(e) => patch("fechaFin", e.target.value)}
                />
                <p className="mt-1.5 text-[11.5px] text-[var(--faint)]">
                  Opcional. Si se completa, las matrículas de esta cohorte se
                  finalizan solas en esa fecha. Tiene que ser una fecha futura.
                </p>
              </div>
            )}
          </div>

          <div className="border border-[var(--line)] bg-[var(--surface)] p-5">
            <div className="flex flex-col gap-2 text-[13.5px]">
              <div className="flex justify-between">
                <span className="text-[var(--dim)]">Precio</span>
                <span>{formatARS(precio)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--dim)]">− Docente</span>
                <span>{formatARS(pagoDocente)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--dim)]">− Comisión</span>
                <span>{formatARS(comisionMonto)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--line)] pt-2 font-medium">
                <span>= Neto</span>
                <span style={{ color: netoPct < 40 ? "var(--danger)" : "var(--good)" }}>
                  {formatARS(neto)}
                </span>
              </div>
              <div className="flex justify-between text-[var(--dim)]">
                <span>Mora</span>
                <span>
                  {draft.moraTipo === "ninguno"
                    ? "sin recargo"
                    : draft.moraTipo === "pct"
                      ? `+ ${moraValor}% de la cuota`
                      : `+ ${formatARS(moraValor)}`}
                </span>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-[1.5] text-[var(--faint)]">
              {netoPct}% del precio queda para la academia. Cambiar el
              precio no toca las cuotas ya congeladas.
            </p>
          </div>

          <div>
            <label className={labelClass}>Alumnos asignados</label>
            <div className="mt-2 flex flex-col gap-px bg-[var(--line)]">
              {enrolled.length === 0 && (
                <div className="bg-[var(--surface)] px-4 py-3 text-[13px] text-[var(--faint)]">
                  Nadie asignado todavía.
                </div>
              )}
              {enrolled.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between bg-[var(--surface)] px-4 py-3 text-[13px]"
                >
                  <span>
                    {e.nombre} · {formatARS(e.cuota)}
                  </span>
                  <button
                    onClick={() => onRemoveStudent(e.id)}
                    className="text-[12px] uppercase tracking-[.06em] text-[var(--danger)] hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex gap-2">
                <select
                  className={`${inputClass} flex-1`}
                  value={addPick}
                  onChange={(e) => setAddPick(e.target.value)}
                >
                  <option value="">Elegir alumno del pool…</option>
                  {pool.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const person = pool.find((p) => p.id === addPick);
                    if (!person || !draft.origCode || !addMotivo.trim()) return;
                    onAssign(person, addMotivo.trim());
                    setAddPick("");
                    setAddMotivo("");
                  }}
                  disabled={!addPick || !draft.origCode || !addMotivo.trim()}
                  className="h-11 shrink-0 border border-[var(--line2)] px-4 text-[12.5px] font-medium uppercase tracking-[.06em] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Asignar
                </button>
              </div>
              <input
                className={inputClass}
                placeholder="Motivo de la asignación manual (ej: beca, cortesía, error de sistema) — obligatorio"
                value={addMotivo}
                onChange={(e) => setAddMotivo(e.target.value)}
              />
            </div>
            {!draft.origCode && (
              <p className="mt-2 text-[12px] text-[var(--faint)]">
                Guardá el curso antes de asignar alumnos.
              </p>
            )}
            {draft.origCode && pool.length === 0 && (
              <p className="mt-2 text-[12px] text-[var(--faint)]">
                No hay alumnos registrados sin asignar a este curso todavía.
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Módulos</label>
            {!draft.origCode ? (
              <p className="mt-2 text-[12px] text-[var(--faint)]">
                Guardá el curso antes de cargar módulos.
              </p>
            ) : (
              <>
                <div className="mt-2 flex flex-col gap-px bg-[var(--line)]">
                  {modules.length === 0 && (
                    <div className="bg-[var(--surface)] px-4 py-3 text-[13px] text-[var(--faint)]">
                      Todavía no hay módulos cargados.
                    </div>
                  )}
                  {modules.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 bg-[var(--surface)] px-4 py-3 text-[13px]"
                    >
                      <span className="shrink-0 text-[var(--faint)]">#{m.numero}</span>
                      <input
                        className="flex-1 border-0 bg-transparent text-[13px] text-[var(--text)] focus:outline-none"
                        defaultValue={m.titulo}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          if (value && value !== m.titulo) onRenameModule(m.id, value);
                        }}
                      />
                      <button
                        onClick={() => onRemoveModule(m.id)}
                        className="shrink-0 text-[12px] uppercase tracking-[.06em] text-[var(--danger)] hover:underline"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    className={`${inputClass} flex-1`}
                    placeholder="Título del nuevo módulo"
                    value={newModuleTitulo}
                    onChange={(e) => setNewModuleTitulo(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      const value = newModuleTitulo.trim();
                      if (!value) return;
                      onAddModule(value);
                      setNewModuleTitulo("");
                    }}
                    disabled={!newModuleTitulo.trim()}
                    className="h-11 shrink-0 border border-[var(--line2)] px-4 text-[12.5px] font-medium uppercase tracking-[.06em] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Agregar
                  </button>
                </div>
              </>
            )}
          </div>

          {errores.length > 0 && (
            <ul className="flex flex-col gap-1.5 border-l-[3px] border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-[12.5px] text-[var(--danger)]">
              {errores.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}

          <button
            onClick={handleSave}
            disabled={errores.length > 0}
            className={`h-12 text-[13px] font-medium uppercase tracking-[.06em] ${
              errores.length > 0
                ? "cursor-not-allowed bg-[var(--surface2)] text-[var(--faint)]"
                : "bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-600)]"
            }`}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
