"use client";

import { useState } from "react";

const STORAGE_KEY = "ew-theme";

export function ThemeToggle() {
  // El script inline de layout.tsx ya aplicó data-theme antes de hidratar,
  // así que leerlo acá en el inicializador da el valor correcto sin efecto
  // (y sin parpadeo): no sincroniza con nada externo, solo lee un estado que
  // ya quedó escrito en el DOM antes de que este componente exista.
  const [light, setLight] = useState(
    () => typeof document !== "undefined" && document.documentElement.dataset.theme === "light"
  );

  function toggle() {
    const next = !light;
    setLight(next);
    if (next) {
      document.documentElement.dataset.theme = "light";
      localStorage.setItem(STORAGE_KEY, "light");
    } else {
      delete document.documentElement.dataset.theme;
      localStorage.setItem(STORAGE_KEY, "dark");
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={light ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      className="text-[11px] font-medium uppercase tracking-[.08em] text-[var(--dim)] transition-colors hover:text-[var(--accent)]"
      suppressHydrationWarning
    >
      {light ? "Modo oscuro" : "Modo claro"}
    </button>
  );
}
