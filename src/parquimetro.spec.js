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

describe("Parquimetro - Diurno mínimo", () => {
  it("1 minuto dentro de 06:00–22:00 cobra 10 Bs", () => {
    const r = calcularTarifa({
      entrada: dt(2025, 9, 6, 10, 0),  // 10:00
      salida:  dt(2025, 9, 6, 10, 1)   // 10:01
    });
    expect(r.total).toBe(10);
    expect(r.desglose.length).toBe(1);
    expect(r.desglose[0].totalDia).toBe(10);
  });
});

describe("Parquimetro - Diurno múltiple", () => {
  it("61 minutos dentro de 06:00–22:00 cobra 20 Bs", () => {
    const r = calcularTarifa({
      entrada: dt(2025, 9, 6, 10, 0),   // 10:00
      salida:  dt(2025, 9, 6, 11, 1)    // 11:01 → 61 minutos
    });
    expect(r.total).toBe(20);
    expect(r.desglose.length).toBe(1);
    expect(r.desglose[0].totalDia).toBe(20);
  });
});