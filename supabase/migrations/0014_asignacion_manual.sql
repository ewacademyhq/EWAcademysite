-- EW Academy — asignación manual de alumnos deja de simular un pago (Fase 1 QA, hallazgo Q20/Q21)
-- Correr en el SQL Editor de Supabase, después de 0001-0013.
--
-- assignStudent() en AdminClient.tsx guardaba medio: "Mercado Pago" aunque
-- no hubo ningún pago por esa vía (ni fila en payments/receipts). Se agrega
-- un valor de enum dedicado para dejar de mentir ese dato.

alter type medio_pago add value 'Manual';
