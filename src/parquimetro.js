// src/parquimetro.js
const DAY_RATE   = 10;  // 06:00–22:00
const NIGHT_RATE = 6;   // 22:00–06:00
const DAILY_CAP  = 50;

function isValidDate(d){ return !isNaN(+d); }
function ceilHoursFromMinutes(mins){ return mins <= 0 ? 0 : Math.ceil(mins / 60); }
function minutesBetween(a, b){ return Math.max(0, Math.ceil((+b - +a) / 60000)); }
function startOfDay(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0); }

export function calcularTarifa({ entrada, salida }) {
  const start = new Date(entrada);
  const end   = new Date(salida);

  if (!isValidDate(start) || !isValidDate(end)) {
    throw new Error("Fecha inválida");
  }
  if (end < start) {
    throw new Error("La hora de salida no puede ser anterior a la de entrada");
  }
  if (+end === +start) {
    return { total: 0, desglose: [] };
  }

  const sameDay = start.getFullYear() === end.getFullYear()
               && start.getMonth() === end.getMonth()
               && start.getDate() === end.getDate();

  const inDayWindow   = (h) => h >= 6 && h < 22;
  const inNightWindow = (h) => h >= 22 || h < 6;

  // --- Cruce diurno → nocturno (mismo día), p.ej. 21:30 → 22:30 ---
  if (sameDay) {
    const cut22 = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 22, 0, 0, 0);
    const startsInDay = inDayWindow(start.getHours());
    const endsInNight = inNightWindow(end.getHours());
    if (startsInDay && endsInNight && start < cut22 && end > cut22) {
      const minsDay   = minutesBetween(start, cut22);
      const minsNight = minutesBetween(cut22, end);
      const bruto = (ceilHoursFromMinutes(minsDay)   * DAY_RATE) +
                    (ceilHoursFromMinutes(minsNight) * NIGHT_RATE);
      const totalDia = Math.min(bruto, DAILY_CAP);
      const fecha = startOfDay(start).toISOString().slice(0,10);
      const total = Number(totalDia.toFixed(2));
      return { total, desglose: [{ fecha, bruto: Number(bruto.toFixed(2)), totalDia: total }] };
    }
  }

  // --- Cruce nocturno → diurno (mismo día), p.ej. 05:50 → 06:10 ---
  if (sameDay) {
    const cut06 = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 6, 0, 0, 0);
    const startsInNight = inNightWindow(start.getHours());
    const endsInDay     = inDayWindow(end.getHours());
    if (startsInNight && endsInDay && start < cut06 && end > cut06) {
      const minsNight = minutesBetween(start, cut06);
      const minsDay   = minutesBetween(cut06, end);
      const bruto = (ceilHoursFromMinutes(minsNight) * NIGHT_RATE) +
                    (ceilHoursFromMinutes(minsDay)   * DAY_RATE);
      const totalDia = Math.min(bruto, DAILY_CAP);
      const fecha = startOfDay(start).toISOString().slice(0,10);
      const total = Number(totalDia.toFixed(2));
      return { total, desglose: [{ fecha, bruto: Number(bruto.toFixed(2)), totalDia: total }] };
    }
  }

  // --- Diurno mismo día ---
  if (sameDay && inDayWindow(start.getHours()) && inDayWindow(end.getHours())) {
    const mins  = minutesBetween(start, end);
    const bruto = ceilHoursFromMinutes(mins) * DAY_RATE;
    const totalDia = Math.min(bruto, DAILY_CAP);
    const fecha = startOfDay(start).toISOString().slice(0,10);
    const total = Number(totalDia.toFixed(2));
    return { total, desglose: [{ fecha, bruto: Number(bruto.toFixed(2)), totalDia: total }] };
  }

  // --- Nocturno mismo día ---
  if (sameDay && inNightWindow(start.getHours()) && inNightWindow(end.getHours())) {
    const mins  = minutesBetween(start, end);
    const bruto = ceilHoursFromMinutes(mins) * NIGHT_RATE;
    const totalDia = Math.min(bruto, DAILY_CAP);
    const fecha = startOfDay(start).toISOString().slice(0,10);
    const total = Number(totalDia.toFixed(2));
    return { total, desglose: [{ fecha, bruto: Number(bruto.toFixed(2)), totalDia: total }] };
  }

  // Otros casos (multi-día, tope por día, ticket perdido) → siguientes ciclos
  return { total: 0, desglose: [] };
}