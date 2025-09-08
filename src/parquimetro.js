// src/parquimetro.js
const DAY_RATE = 10;     // 06:00–22:00
const NIGHT_RATE = 6;    // 22:00–06:00
const DAILY_CAP = 50;

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

  // Caso DIURNO mismo día (ya implementado)
  if (sameDay && inDayWindow(start.getHours()) && inDayWindow(end.getHours())) {
    const mins  = minutesBetween(start, end);
    const hours = ceilHoursFromMinutes(mins);
    const bruto = hours * DAY_RATE;
    const totalDia = Math.min(bruto, DAILY_CAP);
    const fecha = startOfDay(start).toISOString().slice(0,10);
    const total = Number(totalDia.toFixed(2));
    return {
      total,
      desglose: [{ fecha, bruto: Number(bruto.toFixed(2)), totalDia: total }],
    };
  }

  // **Nuevo**: Caso NOCTURNO mismo día (22:00–24:00) *o* (00:00–06:00 del MISMO día
  // (este bloque cubre el test 22:00–22:01; más adelante cubriremos cruces y multi-día)
  if (sameDay && inNightWindow(start.getHours()) && inNightWindow(end.getHours())) {
    const mins  = minutesBetween(start, end);
    const hours = ceilHoursFromMinutes(mins);
    const bruto = hours * NIGHT_RATE;
    const totalDia = Math.min(bruto, DAILY_CAP);
    const fecha = startOfDay(start).toISOString().slice(0,10);
    const total = Number(totalDia.toFixed(2));
    return {
      total,
      desglose: [{ fecha, bruto: Number(bruto.toFixed(2)), totalDia: total }],
    };
  }

  // Otros casos (cruces y multi-día) se cubrirán en ciclos siguientes
  return { total: 0, desglose: [] };
}