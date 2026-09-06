import Link from "next/link";
import { btnPrimary } from "@/components/ui/buttons";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg)] px-6 text-center text-[var(--text)]">
      <div
        className="font-bold uppercase text-[var(--accent)]"
        style={{ fontFamily: "var(--font-humane)", fontSize: "88px", lineHeight: 0.8 }}
      >
        404
      </div>
      <h1 className="text-[19px] font-medium">Esta página no existe</h1>
      <p className="max-w-[46ch] text-[13.5px] leading-[1.6] text-[var(--dim)]">
        Puede que el link esté roto, o que el curso ya no esté disponible.
      </p>
      <Link href="/" className={`${btnPrimary} mt-3`}>
        Volver al inicio
      </Link>
    </div>
  );
}
