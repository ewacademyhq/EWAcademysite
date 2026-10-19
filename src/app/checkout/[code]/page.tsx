import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCourseByCode, registerCourseView } from "@/lib/data/courses";
import { getCurrentUser } from "@/lib/auth";
import { isCourseStale } from "@/lib/business";
import { createClient } from "@/lib/supabase/server";
import { CheckoutHeader } from "@/components/checkout/CheckoutHeader";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

async function hasExistingEnrollment(userId: string, courseCode: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_code", courseCode)
    .maybeSingle();
  return Boolean(data);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const course = await getCourseByCode(code);
  return {
    title: course ? `Checkout — ${course.titulo}` : "Checkout",
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const [course, user] = await Promise.all([getCourseByCode(code), getCurrentUser()]);

  if (!course) notFound();

  if (isCourseStale(course)) {
    // Un autogestionado sin actualizar hace más de 6 meses deja de venderse
    // — pero si el alumno ya tenía una matrícula en curso (ej. transferencia
    // subida, esperando aprobación), no le cortamos el pago a mitad de camino.
    const yaMatriculado = user ? await hasExistingEnrollment(user.id, course.code) : false;
    if (!yaMatriculado) notFound();
  }

  // Fase 7: esta es la "ficha de curso" real que alimenta el embudo de venta
  // y "cursos más consultados" de KPIs — no bloquea el render si falla.
  void registerCourseView(course.code);

  return (
    <>
      <CheckoutHeader backHref={user ? "/panel" : "/"} />
      <CheckoutClient course={course} user={user} />
    </>
  );
}
