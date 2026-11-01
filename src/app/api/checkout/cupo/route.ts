import { NextResponse, type NextRequest } from "next/server";
import { getCourseByCode } from "@/lib/data/courses";
import { cupoDisponible } from "@/lib/data/cupo";

/**
 * Chequeo de cupo antes de dejar avanzar el checkout (tanto el flujo manual
 * como el de Mercado Pago lo llaman desde el cliente, antes de crear la
 * matrícula). `/api/checkout/mercadopago` además repite el chequeo del lado
 * del servidor por las dudas lo llamen directo.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Falta code" }, { status: 400 });

  const course = await getCourseByCode(code);
  if (!course) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

  const { lleno } = await cupoDisponible(course.code, course.cupoMaximo);
  return NextResponse.json({ lleno });
}
