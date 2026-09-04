"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROLE_USER, navFor, type Role } from "@/lib/nav";

export function Sidebar({
  role,
  defaultCourseCode,
}: {
  role: Role;
  defaultCourseCode: string;
}) {
  const pathname = usePathname();
  const user = ROLE_USER[role];
  const items = navFor(role, defaultCourseCode);

  return (
    <aside className="sticky top-0 flex h-screen w-[240px] shrink-0 flex-col border-r-2 border-[var(--line)] bg-[var(--bg2)]">
      <div className="px-6 pt-8 pb-6">
        <Link href="/" className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-75">
          <span
            className="flex h-[34px] w-[34px] items-center justify-center bg-[var(--accent)] text-[15px] font-bold text-[var(--accent-ink)]"
            style={{ clipPath: "polygon(14% 0, 100% 0, 86% 100%, 0 100%)" }}
          >
            EW
          </span>
          <span className="text-[15px] font-medium uppercase tracking-[.14em]">
            Academy
          </span>
        </Link>
        <div className="mt-6 text-[10.5px] font-medium uppercase tracking-[.2em] text-[var(--faint)]">
          {user.label}
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const active = item.isActive(pathname);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`border-l-[3px] px-3.5 py-2.5 text-[13.5px] transition-colors ${
                active
                  ? "border-l-[var(--accent)] bg-[var(--surface2)] text-[var(--text)]"
                  : "border-l-transparent text-[var(--dim)] hover:text-[var(--text)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 border-t border-[var(--line)] px-6 py-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--line2)] text-[11px] font-medium">
          {user.ini}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium">{user.nombre}</div>
          <div className="text-[11.5px] text-[var(--faint)]">{user.label}</div>
        </div>
      </div>
    </aside>
  );
}
