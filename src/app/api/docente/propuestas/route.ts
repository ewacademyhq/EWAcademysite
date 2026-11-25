import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { nextCode, PRECIO_MIN } from "@/lib/business";
import type { Modalidad } from "@/lib/types";

interface PropuestaBody {
  titulo?: string;
  descripcion?: string;
  vertical?: string;
  modalidad?: Modalidad;
  duracion?: string;
  clasesTotales?: number;
  modulos?: string[];
  fechaInicio?: string;
  diasSemana?: number[];
  horaInicio?: string;
}

function validar(body: PropuestaBody): string | null {
  if (!body.titulo || body.titulo.trim().length < 5) return "El título necesita al menos 5 caracteres.";
  if (!body.descripcion || body.descripcion.trim().length < 20) return "La descripción necesita al menos 20 caracteres.";
  if (!body.vertical) return "Falta elegir una vertical.";
  if (body.modalidad !== "cohorte" && body.modalidad !== "continuo") return "Modalidad inválida.";
  if (!body.duracion || !body.duracion.trim()) return "Falta la duración.";
  if (body.modalidad === "cohorte") {
    if (!body.clasesTotales || body.clasesTotales <= 0) {
      return "Las clases totales son obligatorias para un curso de cohorte.";
    }
    if (!body.fechaInicio || !/^\d{4}-\d{2}-\d{2}$/.test(body.fechaInicio)) {
      return "Falta la fecha de inicio de las clases en vivo.";
    }
    if (!body.diasSemana || body.diasSemana.length === 0 || body.diasSemana.some((d) => d < 1 || d > 7)) {
      return "Elegí al menos un día de la semana para las clases en vivo.";
    }
    if (!body.horaInicio || !/^\d{2}:\d{2}$/.test(body.horaInicio)) {
      return "Falta la hora de las clases en vivo.";
    }
  }
  return null;
}

/** El trigger de la base (`courses_check_schedule_conflict`) devuelve este mensaje cuando el horario choca con otro curso — se lo pasamos igual al cliente, pero con 409 en vez de 500. */
function esErrorDeChoqueDeHorario(mensaje: string): boolean {
  return mensaje.includes("una sola cuenta de Zoom");
}

/** El docente propone la estructura de un curso nuevo — queda en estado "propuesta" hasta que el admin la revise. */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.rol !== "docente") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as PropuestaBody | null;
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const error = validar(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const admin = createAdminClient();

  const { data: vertical } = await admin
    .from("verticales")
    .select("prefijo")
    .eq("nombre", body.vertical!)
    .maybeSingle();
  if (!vertical) return NextResponse.json({ error: "Esa vertical no existe" }, { status: 400 });

  const { data: existentes } = await admin.from("courses").select("code");
  const code = nextCode(vertical.prefijo, existentes ?? []);

  const { error: insertError } = await admin.from("courses").insert({
    code,
    vertical: body.vertical,
    modalidad: body.modalidad,
    titulo: body.titulo!.trim(),
    descripcion: body.descripcion!.trim(),
    duracion: body.duracion!.trim(),
    clases_totales: body.modalidad === "cohorte" ? body.clasesTotales : null,
    docente_id: user.id,
    // Placeholder — nunca se muestra (el curso no es público hasta "publicado"),
    // el admin carga el precio real al aprobar la estructura. No puede ser 0:
    // `courses_precio_check` exige precio >= PRECIO_MIN para cualquier fila.
    precio: PRECIO_MIN,
    estado: "propuesta",
    fecha_inicio: body.modalidad === "cohorte" ? body.fechaInicio : null,
    dias_semana: body.modalidad === "cohorte" ? body.diasSemana : null,
    hora_inicio: body.modalidad === "cohorte" ? body.horaInicio : null,
  });
  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: esErrorDeChoqueDeHorario(insertError.message) ? 409 : 500 }
    );
  }

  const modulos = (body.modulos ?? []).map((titulo) => titulo.trim()).filter(Boolean);
  if (modulos.length > 0) {
    const { error: modulosError } = await admin.from("modules").insert(
      modulos.map((titulo, i) => ({ course_code: code, numero: i + 1, titulo }))
    );
    if (modulosError) {
      // El curso ya quedó creado — no lo borramos por un fallo en los módulos,
      // el docente los puede cargar después desde su panel.
      return NextResponse.json({ code, warning: `No se pudieron cargar los módulos: ${modulosError.message}` });
    }
  }

  return NextResponse.json({ code });
}
