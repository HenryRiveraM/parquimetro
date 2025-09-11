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

describe("Parquímetro – Ticket perdido", () => {
  it("retorna 80 Bs y sin desglose (sin necesidad de horas)", () => {
    const r = calcularTarifa({ ticketPerdido: true });
    expect(r.total).toBe(80);
    expect(r.desglose).toEqual([]);
  });

  it("retorna 80 Bs incluso si se pasan horas (reemplaza cálculo normal)", () => {
    const r = calcularTarifa({
      entrada: dt(2025, 9, 12, 10, 0),
      salida:  dt(2025, 9, 12, 18, 0),
      ticketPerdido: true
    });
    expect(r.total).toBe(80);
    expect(r.desglose).toEqual([]);
  });
});

describe("Parquímetro – Tope por día al cruzar días", () => {
  it("aplica 50 Bs por cada día de forma independiente (total = suma de días cappeados)", () => {
    // Día 1: 21:00→24:00  => 1h diurna (10) + 2h nocturna (12) = 22 (NO cap)
    // Día 2: 00:00→18:00  => 6h noct (36) + 12h diurnas (120) = 156 -> cap a 50
    const r = calcularTarifa({
      entrada: dt(2025, 9, 11, 21, 0),
      salida:  dt(2025, 9, 12, 18, 0)
    });
    expect(r.desglose.length).toBe(2);
    expect(r.desglose[0].totalDia).toBe(22); // día 1
    expect(r.desglose[1].totalDia).toBe(50); // día 2 cappeado
    expect(r.total).toBe(72);                // 22 + 50
  });
});

describe("Parquímetro – Borde 22:00 exacto", () => {
  it("21:00→22:00 = 10 Bs (diurno exacto)", () => {
    const r = calcularTarifa({
      entrada: dt(2025, 9, 13, 21, 0),
      salida:  dt(2025, 9, 13, 22, 0)
    });
    expect(r.total).toBe(10);
    expect(r.desglose[0].totalDia).toBe(10);
  });


  it("22:00→22:01 = 6 Bs (inicio nocturno)", () => {
    const r = calcularTarifa({
      entrada: dt(2025, 9, 13, 22, 0),
      salida:  dt(2025, 9, 13, 22, 1)
    });
    expect(r.total).toBe(6);
    expect(r.desglose[0].totalDia).toBe(6);
  });
});

describe("Parquímetro – Borde 06:00 exacto", () => {
  it("05:00→06:00 = 6 Bs (nocturno exacto)", () => {
    const r = calcularTarifa({
      entrada: dt(2025, 9, 14, 5, 0),
      salida:  dt(2025, 9, 14, 6, 0)
    });
    expect(r.total).toBe(6);
    expect(r.desglose[0].totalDia).toBe(6);
  });


  it("06:00→06:01 = 10 Bs (inicio diurno)", () => {
    const r = calcularTarifa({
      entrada: dt(2025, 9, 14, 6, 0),
      salida:  dt(2025, 9, 14, 6, 1)
    });
    expect(r.total).toBe(10);
    expect(r.desglose[0].totalDia).toBe(10);
  });
});

});