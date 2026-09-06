// Promueve un usuario ya registrado a un rol (alumno/docente/admin). Necesario
// porque todavía no hay UI de invitación de staff — eso llega cuando el admin
// gestione usuarios reales (ver docs/IMPLEMENTATION_PLAN.md).
//
// El usuario tiene que existir antes en Authentication → Users del dashboard
// de Supabase (o haberse registrado solo).
//
// Uso: npm run db:set-role -- <email> <alumno|docente|admin> ["Nombre Apellido"]

import { createClient } from "@supabase/supabase-js";

const [, , email, rol, nombre] = process.argv;
const ROLES = ["alumno", "docente", "admin"];

if (!email || !rol || !ROLES.includes(rol)) {
  console.error(
    'Uso: npm run db:set-role -- <email> <alumno|docente|admin> ["Nombre Apellido"]'
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error buscando el usuario:", listError.message);
    process.exit(1);
  }

  const authUser = usersList.users.find((u) => u.email === email);
  if (!authUser) {
    console.error(
      `No existe ningún usuario con el email ${email}. Crealo primero desde ` +
        "Authentication → Users en el dashboard de Supabase, o registrate en /login."
    );
    process.exit(1);
  }

  const update: { rol: string; nombre?: string } = { rol };
  if (nombre) update.nombre = nombre;

  const { error } = await supabase.from("users").update(update).eq("id", authUser.id);
  if (error) {
    console.error("Error actualizando el rol:", error.message);
    process.exit(1);
  }

  console.log(`Listo: ${email} ahora es "${rol}"${nombre ? ` (${nombre})` : ""}.`);
}

main();
