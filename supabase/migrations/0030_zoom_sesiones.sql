-- EW Academy — Zoom crea las reuniones de las clases en vivo automáticamente.
-- La grabación sigue siendo manual (se baja de Zoom y se sube a Drive a mano,
-- no hay integración de API para eso): no hace falta ninguna columna nueva
-- para grabaciones, solo guardar qué reunión de Zoom le corresponde a cada
-- sesión para poder reprogramarla/cancelarla sin crear una reunión fantasma.

alter table course_sessions add column zoom_meeting_id bigint;
