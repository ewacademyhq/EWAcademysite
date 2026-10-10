import Link from "next/link";
import { Footer } from "@/components/landing/Footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <header className="flex h-[70px] items-center border-b-2 border-[var(--line)] px-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="flex h-[34px] w-[34px] items-center justify-center bg-[var(--accent)] text-[15px] font-bold text-[var(--accent-ink)]"
            style={{ clipPath: "polygon(14% 0, 100% 0, 86% 100%, 0 100%)" }}
          >
            EW
          </span>
          <span className="text-[15px] font-medium uppercase tracking-[.14em]">Academy</span>
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-14 sm:px-8">{children}</main>
      <Footer />
    </div>
  );
}
