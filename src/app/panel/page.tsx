import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { PanelClient } from "@/components/panel/PanelClient";
import { getCurrentUser } from "@/lib/auth";
import { getMyEnrollments, getMyPayments, type PaymentRow } from "@/lib/data/mycourse";
import { getCourses } from "@/lib/data/courses";

export default async function PanelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [enrollments, courses] = await Promise.all([
    getMyEnrollments(user.nombre),
    getCourses(),
  ]);

  const paymentsEntries = await Promise.all(
    enrollments.map(async (e) => [e.id, await getMyPayments(e.id)] as [number, PaymentRow[]])
  );
  const paymentsByEnrollment = Object.fromEntries(paymentsEntries);

  return (
    <AppShell role="alumno" defaultCourseCode={enrollments[0]?.code ?? ""}>
      <PanelClient
        enrollments={enrollments}
        courses={courses}
        paymentsByEnrollment={paymentsByEnrollment}
      />
    </AppShell>
  );
}
