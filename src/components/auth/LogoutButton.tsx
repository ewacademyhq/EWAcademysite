"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-[11px] font-medium uppercase tracking-[.08em] text-[var(--faint)] transition-colors hover:text-[var(--danger)]"
    >
      Salir
    </button>
  );
}
