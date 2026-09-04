// Carga los fixtures de ejemplo (src/lib/fixtures.ts) en Supabase, SOLO para
// tener algo con qué probar en desarrollo local. No es contenido real — ver
// docs/SPEC.md §0 (EWA-000). El catálogo de verdad se carga a mano desde el
// panel de administración (Fase 3 del plan de implementación).
//
// Uso: npm run db:seed

import { createClient } from "@supabase/supabase-js";
import { COURSES0 } from "../src/lib/fixtures.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Corré este script con: node --experimental-strip-types --env-file=.env.local scripts/seed.ts"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`Sembrando ${COURSES0.length} cursos de ejemplo (dev only)...`);

  const rows = COURSES0.map((c) => ({
    code: c.code,
    vertical: c.vertical,
    modalidad: c.modalidad,
    titulo: c.titulo,
    descripcion: c.desc,
    precio: c.precio,
    fecha_inicio: c.modalidad === "cohorte" ? parseFecha(c.fecha) : null,
    duracion: c.duracion,
    pago_tipo: c.pagoTipo,
    pago_valor: c.pagoValor,
    comision: c.comision,
    mora_tipo: c.moraTipo ?? "pct",
    mora_valor: c.moraValor ?? 5,
    vendidos: c.vendidos,
    vistas: c.vistas,
  }));

  const { error } = await supabase.from("courses").upsert(rows, { onConflict: "code" });

  if (error) {
    console.error("Error al sembrar cursos:", error.message);
    process.exit(1);
  }

  console.log("Listo. Cursos de ejemplo cargados en Supabase.");
}

function parseFecha(fecha: string): string | null {
  const match = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

main();
