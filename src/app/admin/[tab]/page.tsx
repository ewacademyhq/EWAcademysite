import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { AdminClient, type AdminTab } from "@/components/admin/AdminClient";

const VALID_TABS: AdminTab[] = ["kpi", "pagos", "cursos", "matriculas", "economia"];

export default async function AdminTabPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const { tab } = await params;

  if (!VALID_TABS.includes(tab as AdminTab)) notFound();

  return (
    <AppShell role="admin" defaultCourseCode="">
      <AdminClient tab={tab as AdminTab} />
    </AppShell>
  );
}
