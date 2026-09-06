import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-8 py-16">
      <Link href="/" className="mb-10 flex items-center gap-2.5">
        <span
          className="flex h-[34px] w-[34px] items-center justify-center bg-[var(--accent)] text-[15px] font-bold text-[var(--accent-ink)]"
          style={{ clipPath: "polygon(14% 0, 100% 0, 86% 100%, 0 100%)" }}
        >
          EW
        </span>
        <span className="text-[15px] font-medium uppercase tracking-[.14em]">Academy</span>
      </Link>

      <h1
        className="mb-8 font-bold uppercase text-[var(--text)]"
        style={{ fontFamily: "var(--font-humane)", fontSize: "48px", lineHeight: 0.84 }}
      >
        Ingresar
      </h1>

      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
