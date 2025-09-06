import { calcularTarifa } from "./parquimetro.js";

function dt(y, m, d, hh, mm = 0) {
  return new Date(`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}T${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}:00`);
}

describe("Parquimetro - Validación de horarios", () => {
  it("lanza error si la hora de salida es anterior a la de entrada", () => {
    expect(() => calcularTarifa({
      entrada: dt(2025,9,6,10,0),
      salida: dt(2025,9,6,9,0)
    })).toThrow("La hora de salida no puede ser anterior a la de entrada");
  });
});