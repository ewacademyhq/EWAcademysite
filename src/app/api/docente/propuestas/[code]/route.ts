import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Modalidad } from "@/lib/types";

interface PropuestaBody {
  titulo?: string;
  descripcion?: string;
  vertical?: string;
  modalidad?: Modalidad;
  duracion?: string;
  clasesTotales?: number;
  modulos?: string[];
}

function validar(body: PropuestaBody): string | null {
  if (!body.titulo || body.titulo.trim().length < 5) return "El título necesita al menos 5 caracteres.";
  if (!body.descripcion || body.descripcion.trim().length < 20) return "La descripción necesita al menos 20 caracteres.";
  if (!body.vertical) return "Falta elegir una vertical.";
  if (body.modalidad !== "cohorte" && body.modalidad !== "continuo") return "Modalidad inválida.";
  if (!body.duracion || !body.duracion.trim()) return "Falta la duración.";
  if (body.modalidad === "cohorte" && (!body.clasesTotales || body.clasesTotales <= 0)) {
    return "Las clases totales son obligatorias para un curso de cohorte.";
  }
  return null;
}

/** El docente edita una propuesta rechazada y la vuelve a mandar a revisión. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.rol !== "docente") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { code } = await params;
  const body = (await request.json().catch(() => null)) as PropuestaBody | null;
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const error = validar(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const admin = createAdminClient();

  const { data: course } = await admin
    .from("courses")
    .select("docente_id, estado")
    .eq("code", code)
    .maybeSingle();
  if (!course || course.docente_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (course.estado !== "rechazada") {
    return NextResponse.json({ error: "Esta propuesta no está en estado rechazada" }, { status: 400 });
  }

  const { error: updateError } = await admin
    .from("courses")
    .update({
      titulo: body.titulo!.trim(),
      descripcion: body.descripcion!.trim(),
      vertical: body.vertical,
      modalidad: body.modalidad,
      duracion: body.duracion!.trim(),
      clases_totales: body.modalidad === "cohorte" ? body.clasesTotales : null,
      estado: "propuesta",
      motivo_rechazo: null,
    })
    .eq("code", code);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const modulos = (body.modulos ?? []).map((titulo) => titulo.trim()).filter(Boolean);
  await admin.from("modules").delete().eq("course_code", code);
  if (modulos.length > 0) {
    const { error: modulosError } = await admin.from("modules").insert(
      modulos.map((titulo, i) => ({ course_code: code, numero: i + 1, titulo }))
    );
    if (modulosError) {
      return NextResponse.json({ warning: `No se pudieron cargar los módulos: ${modulosError.message}` });
    }
  }

  return NextResponse.json({ ok: true });
}
