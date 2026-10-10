-- O2: el admin marca una factura de docente como pagada. La tabla `facturas`
-- (0016_facturacion_docente.sql) ya deja que el propio docente actualice su
-- fila, pero nunca se agregó una policy de UPDATE para el admin.
create policy "Un admin actualiza el estado de las facturas"
  on facturas for update to authenticated using (is_admin()) with check (is_admin());
