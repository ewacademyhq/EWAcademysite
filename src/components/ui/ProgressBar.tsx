export function ProgressBar({ percent, tone = "accent" }: { percent: number; tone?: "accent" | "danger" | "dim" }) {
  const color =
    tone === "danger" ? "var(--danger)" : tone === "dim" ? "var(--line2)" : "var(--accent)";

  return (
    <div className="h-2 w-full bg-[var(--surface2)]">
      <div
        className="h-full origin-left"
        style={{ width: `${percent}%`, background: color, animation: "grow .7s cubic-bezier(.2,.7,.2,1)" }}
      />
    </div>
  );
}
