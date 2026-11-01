import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createZoomMeeting, deleteZoomMeeting, isZoomConfigured } from "@/lib/zoom";
import { findOverlappingSession, overlapWarning } from "@/lib/session-overlap";

/**
 * Agenda una clase. Si viene `meetUrl` en el body (el docente/admin cargó un
 * link a mano), se guarda tal cual y Zoom ni se llama — es el respaldo por
 * si la API de Zoom falla o se prefiere pegar un link propio, siempre
 * disponible, no solo cuando el auto-create falla. Si no viene, se crea la
 * reunión en la cuenta única de Zoom y se guarda su join_url. Si el guardado
 * en base falla después de crear en Zoom (p.ej. RLS — no es el docente dueño
 * del curso) se borra la reunión recién creada para no dejar reuniones
 * fantasma en la cuenta de Zoom.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.rol !== "docente" && user.rol !== "admin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const courseCode = (body?.courseCode as string | undefined)?.trim();
  const titulo = (body?.titulo as string | undefined)?.trim();
  const fecha = body?.fecha as string | undefined;
  const meetUrlManual = (body?.meetUrl as string | undefined)?.trim();

  if (!courseCode || !titulo || !fecha) {
    return NextResponse.json({ error: "Faltan título, fecha o curso" }, { status: 400 });
  }
  if (new Date(fecha) <= new Date()) {
    return NextResponse.json({ error: "La fecha de la clase tiene que ser futura" }, { status: 400 });
  }

  const supabase = await createClient();

  // Una sola cuenta de Zoom para toda la academia — avisamos si se pisa con
  // otra clase ya agendada (de cualquier curso), pero no bloqueamos.
  const overlap = await findOverlappingSession(supabase, fecha);
  const warning = overlap ? overlapWarning(overlap) : undefined;

  if (meetUrlManual) {
    const { data, error } = await supabase
      .from("course_sessions")
      .insert({
        course_code: courseCode,
        titulo,
        fecha: new Date(fecha).toISOString(),
        meet_url: meetUrlManual,
        zoom_meeting_id: null,
      })
      .select("id, course_code, titulo, fecha, meet_url")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "No se pudo agendar la clase" }, { status: 403 });
    }
    return NextResponse.json({ ...data, warning });
  }

  if (!isZoomConfigured()) {
    return NextResponse.json({ error: "Zoom no está configurado" }, { status: 500 });
  }

  let meeting;
  try {
    meeting = await createZoomMeeting(titulo, new Date(fecha).toISOString());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo crear la reunión de Zoom" },
      { status: 502 }
    );
  }

  const { data, error } = await supabase
    .from("course_sessions")
    .insert({
      course_code: courseCode,
      titulo,
      fecha: new Date(fecha).toISOString(),
      meet_url: meeting.joinUrl,
      zoom_meeting_id: meeting.id,
    })
    .select("id, course_code, titulo, fecha, meet_url")
    .single();

  if (error || !data) {
    await deleteZoomMeeting(meeting.id).catch(() => {});
    return NextResponse.json({ error: error?.message ?? "No se pudo agendar la clase" }, { status: 403 });
  }

  return NextResponse.json({ ...data, warning });
}
