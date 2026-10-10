import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

interface CertificadoPublico {
  alumno_nombre: string;
  curso_titulo: string;
  duracion: string;
  vertical: string;
  emitido_at: string;
}

export default async function CertificadoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_certificado_publico", { p_codigo: codigo }).maybeSingle<CertificadoPublico>();

  if (!data) notFound();

  const fecha = new Date(data.emitido_at);
  const fechaLabel = `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;

  return (
    <main className="mx-auto flex min-h-screen max-w-[640px] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center bg-[var(--good)] text-[22px] text-white">✓</div>
      <h1
        className="mt-6 font-bold uppercase text-[var(--text)]"
        style={{ fontFamily: "var(--font-humane)", fontSize: "32px", lineHeight: 0.9 }}
      >
        Certificado verificado
      </h1>
      <p className="mt-3 text-[14px] text-[var(--dim)]">
        Este certificado fue emitido por EW Academia y es auténtico.
      </p>

      <div className="mt-8 w-full border border-[var(--line)] bg-[var(--surface)] p-7 text-left">
        <div className="text-[11px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">Alumno</div>
        <div className="mt-1 text-[20px] font-medium">{data.alumno_nombre}</div>

        <div className="mt-5 text-[11px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">Curso</div>
        <div className="mt-1 text-[16px] font-medium text-[var(--accent)]">{data.curso_titulo}</div>

        <div className="mt-5 grid grid-cols-3 gap-4 border-t border-[var(--line)] pt-5">
          <div>
            <div className="text-[10.5px] uppercase tracking-[.1em] text-[var(--faint)]">Duración</div>
            <div className="mt-1 text-[13.5px] font-medium">{data.duracion}</div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-[.1em] text-[var(--faint)]">Área</div>
            <div className="mt-1 text-[13.5px] font-medium">{data.vertical}</div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-[.1em] text-[var(--faint)]">Emitido</div>
            <div className="mt-1 text-[13.5px] font-medium">{fechaLabel}</div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-[11.5px] text-[var(--faint)]">Código {codigo.toUpperCase()}</p>
    </main>
  );
}
