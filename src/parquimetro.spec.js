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

describe("Parquimetro - Nocturno mínimo", () => {
  it("1 minuto dentro de 22:00–06:00 cobra 6 Bs", () => {
    const r = calcularTarifa({
      entrada: dt(2025, 9, 6, 22, 0),  // 22:00
      salida:  dt(2025, 9, 6, 22, 1)   // 22:01
    });
    expect(r.total).toBe(6);
    expect(r.desglose.length).toBe(1);
    expect(r.desglose[0].totalDia).toBe(6);
  });
});

describe("Parquimetro - Nocturno múltiple", () => {
  it("61 minutos dentro de 22:00–06:00 cobra 12 Bs", () => {
    const r = calcularTarifa({
      entrada: dt(2025, 9, 6, 22, 0),  // 22:00
      salida:  dt(2025, 9, 6, 23, 1)   // 23:01 -> 61 minutos
    });
    expect(r.total).toBe(12);
    expect(r.desglose.length).toBe(1);
    expect(r.desglose[0].totalDia).toBe(12);
  });
});

describe("Parquimetro - Cruce diurno→nocturno (mismo día)", () => {
  it("21:30 → 22:30 = 16 Bs (30' diurno + 30' nocturno)", () => {
    const r = calcularTarifa({
      entrada: dt(2025, 9, 6, 21, 30),
      salida:  dt(2025, 9, 6, 22, 30)
    });
    expect(r.total).toBe(16);
    expect(r.desglose.length).toBe(1);
    expect(r.desglose[0].totalDia).toBe(16);
  });
});

describe("Parquimetro - Cruce nocturno→diurno (madrugada)", () => {
  it("05:50 → 06:10 = 16 Bs (10' nocturno + 10' diurno)", () => {
    const r = calcularTarifa({
      entrada: dt(2025, 9, 7, 5, 50),
      salida:  dt(2025, 9, 7, 6, 10)
    });
    expect(r.total).toBe(16);
    expect(r.desglose.length).toBe(1);
    expect(r.desglose[0].totalDia).toBe(16);
  });

  describe("Parquimetro - Cruce de días calendario", () => {
  it("23:10 (día1) → 05:20 (día2) = 42 Bs con desglose por fecha", () => {
    const r = calcularTarifa({
      entrada: dt(2025, 9, 9, 23, 10),
      salida:  dt(2025, 9, 10, 5, 20)
    });
    expect(r.total).toBe(42);
    expect(r.desglose.length).toBe(2);
    expect(r.desglose[0].totalDia).toBe(6);
    expect(r.desglose[1].totalDia).toBe(36);
  });
});

});