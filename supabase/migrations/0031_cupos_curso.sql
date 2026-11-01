-- EW Academy — cupo máximo y mínimo por curso.
-- cupo_maximo: aplica a cualquier modalidad (tope de alumnos, también evita
-- superar el límite de 100 participantes por reunión de Zoom en cohorte).
-- cupo_minimo: solo tiene sentido en cohorte (mínimo de alumnos para que la
-- cursada arranque) — no se valida por modalidad a nivel de base, el admin
-- lo deja vacío en autogestionado como ya hace con clases_totales.

alter table courses
  add column cupo_maximo integer,
  add column cupo_minimo integer;

alter table courses
  add constraint courses_cupo_maximo_check check (cupo_maximo is null or cupo_maximo > 0),
  add constraint courses_cupo_minimo_check check (cupo_minimo is null or cupo_minimo > 0);

-- Marca un curso de cohorte que quedó en 0 alumnos porque se unificó con
-- otro (ver "Unificar con otro curso" en CursosTab) — distingue ese caso de
-- un curso nuevo que todavía no vendió nada. No hace falta apagarlo nunca a
-- mano: la UI solo muestra el aviso de "listo para borrar" cuando además
-- tiene 0 inscriptos, así que si el curso vuelve a tener alumnos el aviso
-- deja de mostrarse solo, aunque la columna siga en true.
alter table courses add column pendiente_borrado boolean not null default false;
