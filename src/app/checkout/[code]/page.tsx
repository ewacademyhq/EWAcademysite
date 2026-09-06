import { notFound } from "next/navigation";
import { getCourseByCode, registerCourseView } from "@/lib/data/courses";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutHeader } from "@/components/checkout/CheckoutHeader";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const [course, user] = await Promise.all([getCourseByCode(code), getCurrentUser()]);

  if (!course) notFound();

  // Fase 7: esta es la "ficha de curso" real que alimenta el embudo de venta
  // y "cursos más consultados" de KPIs — no bloquea el render si falla.
  void registerCourseView(course.code);

  return (
    <>
      <CheckoutHeader />
      <CheckoutClient course={course} user={user} />
    </>
  );
}
