import Link from "next/link";

export function BackLink({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center gap-2 border border-[var(--line2)] px-4 text-[11.5px] font-medium uppercase tracking-[.08em] text-[var(--dim)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
    >
      ← Volver
    </Link>
  );
}
