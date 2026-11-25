import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteZoomMeeting, updateZoomMeeting } from "@/lib/zoom";
import { findScheduleConflict, scheduleConflictMessage } from "@/lib/session-overlap";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.rol !== "docente" && user.rol !== "admin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const titulo = (body?.titulo as string | undefined)?.trim();
  const fecha = body?.fecha as string | undefined;
  // Presente solo cuando el docente/admin tocó el campo de link a mano
  // (ver DocenteClient: compara contra el valor original antes de mandarlo).
  const meetUrlManual = (body?.meetUrl as string | undefined)?.trim();

  if (!titulo || !fecha) {
    return NextResponse.json({ error: "Faltan título o fecha" }, { status: 400 });
  }
  if (new Date(fecha) <= new Date()) {
    return NextResponse.json({ error: "La fecha de la clase tiene que ser futura" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("course_sessions")
    .select("id, course_code, zoom_meeting_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
  }

  // Una sola cuenta de Zoom para toda la academia — bloquea antes de tocar
  // Zoom o la base si el nuevo horario choca con otra clase o con el
  // patrón semanal de otro curso.
  const conflict = await findScheduleConflict(supabase, fecha, existing.course_code, Number(id));
  if (conflict) {
    return NextResponse.json({ error: scheduleConflictMessage(conflict) }, { status: 409 });
  }

  // Si cargaron un link a mano, eso manda: no tocamos Zoom y la sesión pasa
  // a manejarse manual de ahí en más (se limpia zoom_meeting_id). Si no,
  // sesiones con reunión de Zoom mueven esa misma reunión; sesiones viejas
  // sin zoom_meeting_id (link pegado a mano desde el vamos) solo actualizan
  // título/fecha.
  const updatePayload: Record<string, unknown> = { titulo, fecha: new Date(fecha).toISOString() };

  if (meetUrlManual) {
    updatePayload.meet_url = meetUrlManual;
    updatePayload.zoom_meeting_id = null;
    // La reunión vieja de Zoom queda huérfana si no la borramos acá —
    // best-effort, no bloqueamos el guardado si Zoom falla en este paso.
    if (existing.zoom_meeting_id) {
      await deleteZoomMeeting(existing.zoom_meeting_id).catch(() => {});
    }
  } else if (existing.zoom_meeting_id) {
    try {
      await updateZoomMeeting(existing.zoom_meeting_id, titulo, new Date(fecha).toISOString());
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "No se pudo reprogramar en Zoom" },
        { status: 502 }
      );
    }
  }

  const { data, error } = await supabase
    .from("course_sessions")
    .update(updatePayload)
    .eq("id", id)
    .select("id, course_code, titulo, fecha, meet_url")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "No se pudo reprogramar la clase" }, { status: 403 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.rol !== "docente" && user.rol !== "admin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("course_sessions")
    .select("id, zoom_meeting_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
  }

  if (existing.zoom_meeting_id) {
    await deleteZoomMeeting(existing.zoom_meeting_id).catch(() => {});
  }

  const { error } = await supabase.from("course_sessions").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
