import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Verificar email", robots: { index: false, follow: false } };

export default async function VerificarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let ok = false;
  if (token) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("verificar_email_por_token", { p_token: token });
    ok = data === true;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-8 py-16 text-center">
      <h1
        className="mb-3 font-bold uppercase text-[var(--text)]"
        style={{ fontFamily: "var(--font-humane)", fontSize: "40px", lineHeight: 0.88 }}
      >
        {ok ? "Email confirmado" : "No pudimos confirmarlo"}
      </h1>
      <p className="max-w-[360px] text-[13.5px] text-[var(--dim)]">
        {ok
          ? "Gracias — ya marcamos tu cuenta como verificada."
          : "Este link ya se usó, venció o no es válido. Si lo necesitás de nuevo, pedilo desde tu panel."}
      </p>
      <Link
        href="/panel"
        className="mt-8 h-11 px-5 inline-flex items-center bg-[var(--accent)] text-[13px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-600)]"
      >
        Ir a mi panel
      </Link>
    </main>
  );
}
