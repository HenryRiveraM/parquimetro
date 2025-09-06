// src/parquimetro.js
export function calcularTarifa({ entrada, salida }) {
  const start = new Date(entrada);
  const end = new Date(salida);

  if (isNaN(+start) || isNaN(+end)) {
    throw new Error("Fecha inválida");
  }

  if (end < start) {
    throw new Error("La hora de salida no puede ser anterior a la de entrada");
  }

  // Implementación mínima para este ciclo TDD
  return { total: 0, desglose: [] };
}