"use client";

import { useState } from "react";
import type { DocenteConCursos } from "@/lib/data/admin";
import { createClient } from "@/lib/supabase/client";
import { formatARS } from "@/lib/format";

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function periodoCorto(periodo: string) {
  const [yyyy, mm] = periodo.split("-");
  return `${MESES[Number(mm) - 1]} ${yyyy}`;
}

export function DocentesTab({
  docentes,
  onCreate,
  onToggleActivo,
}: {
  docentes: DocenteConCursos[];
  onCreate: (email: string, nombre: string) => void;
  onToggleActivo: (id: string, activo: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");

  const puedeCrear = email.trim().length > 3 && nombre.trim().length > 1;

  function handleCreate() {
    if (!puedeCrear) return;
    onCreate(email.trim(), nombre.trim());
    setEmail("");
    setNombre("");
  }

  async function verFactura(path: string) {
    const nuevaPestana = window.open("", "_blank", "noopener,noreferrer");
    const supabase = createClient();
    const { data } = await supabase.storage.from("facturas").createSignedUrl(path, 3600);
    if (data && nuevaPestana) nuevaPestana.location.href = data.signedUrl;
    else nuevaPestana?.close();
  }

  return (
    <div className="px-[34px] py-6">
      <p className="mb-4 text-[12.5px] text-[var(--faint)]">
        Dar de alta manda una invitación por correo (vía Supabase) para que el
        docente fije su contraseña. Dar de baja revoca el acceso y lo saca del
        selector de &quot;Docente&quot; al crear o editar un curso.
      </p>

      <div className="mb-6 flex flex-wrap items-end gap-3 border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex-1 min-w-[220px]">
          <label className="text-[11px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            Nombre
          </label>
          <input
            className="mt-2 h-11 w-full border border-[var(--line2)] bg-[var(--surface)] px-3.5 text-[14.5px]"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre y apellido"
          />
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className="text-[11px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            Email
          </label>
          <input
            className="mt-2 h-11 w-full border border-[var(--line2)] bg-[var(--surface)] px-3.5 text-[14.5px]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="docente@ejemplo.com"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={!puedeCrear}
          className="h-11 shrink-0 bg-[var(--accent)] px-5 text-[12.5px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Dar de alta
        </button>
      </div>

      <div className="overflow-x-auto border border-[var(--line)] bg-[var(--surface)]">
        <div className="min-w-[960px]">
          <div className="grid grid-cols-[1.2fr_1.3fr_.6fr_1.3fr_1.1fr_auto] gap-4 border-b border-[var(--line)] px-6 py-3 text-[11px] font-medium uppercase tracking-[.08em] text-[var(--faint)]">
            <span>Nombre</span>
            <span>Email</span>
            <span>Estado</span>
            <span>Cursos asignados</span>
            <span>Última factura</span>
            <span className="justify-self-end">Acciones</span>
          </div>
          {docentes.length === 0 && (
            <div className="px-6 py-8 text-center text-[13px] text-[var(--faint)]">
              Todavía no hay ningún docente dado de alta.
            </div>
          )}
          {docentes.map((d, i) => (
            <div
              key={d.id}
              className={`grid grid-cols-[1.2fr_1.3fr_.6fr_1.3fr_1.1fr_auto] items-center gap-4 px-6 py-3.5 text-[13px] ${
                i !== docentes.length - 1 ? "border-b border-[var(--line)]" : ""
              }`}
            >
              <span>{d.nombre}</span>
              <span className="text-[var(--dim)]">{d.email}</span>
              <span style={{ color: d.activo ? "var(--good)" : "var(--faint)" }}>
                {d.activo ? "Activo" : "Dado de baja"}
              </span>
              <span className="text-[var(--dim)]">
                {d.cursos.length ? d.cursos.join(", ") : "Sin cursos asignados"}
              </span>
              {d.ultimaFactura ? (
                <button
                  onClick={() => verFactura(d.ultimaFactura!.archivoUrl)}
                  className="justify-self-start text-left text-[var(--dim)] hover:text-[var(--accent)] hover:underline"
                >
                  {periodoCorto(d.ultimaFactura.periodo)} · {formatARS(d.ultimaFactura.monto)}
                </button>
              ) : (
                <span className="text-[var(--faint)]">Sin facturas</span>
              )}
              <div className="justify-self-end">
                <button
                  onClick={() => onToggleActivo(d.id, !d.activo)}
                  className="h-8 border px-3 text-[11.5px] font-medium uppercase tracking-[.06em]"
                  style={{
                    borderColor: d.activo ? "var(--danger)" : "var(--line2)",
                    color: d.activo ? "var(--danger)" : "var(--text)",
                  }}
                >
                  {d.activo ? "Dar de baja" : "Reactivar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
