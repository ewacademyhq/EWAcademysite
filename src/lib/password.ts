// Mínimo 8 caracteres, con al menos una mayúscula, una minúscula y un
// carácter especial (no alfanumérico) — política de seguridad del proyecto.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_REQUISITOS_MSG =
  "La contraseña necesita al menos 8 caracteres, con mayúsculas, minúsculas y un carácter especial.";

export function passwordValida(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}
