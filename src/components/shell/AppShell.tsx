import type { ReactNode } from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import type { Role } from "@/lib/nav";

export function AppShell({
  role,
  defaultCourseCode,
  children,
}: {
  role: Role;
  defaultCourseCode: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} defaultCourseCode={defaultCourseCode} />
      <main className="flex-1 pb-[140px]">{children}</main>
    </div>
  );
}
