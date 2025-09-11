// Reglas comerciales
const DAY_RATE    = 10;  // 06:00–22:00
const NIGHT_RATE  = 6;   // 22:00–06:00
const DAILY_CAP   = 50;  // tope por día calendario

// Helpers de fecha/tiempo
function isValidDate(d){ return !isNaN(+d); }
function startOfDay(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0); }
function endOfDay(d){   return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999); }
function ceilHoursFromMinutes(mins){ return mins <= 0 ? 0 : Math.ceil(mins / 60); }
function minutesBetween(a, b){ return Math.max(0, Math.ceil((+b - +a) / 60000)); }
function cutAt(d, h, m=0){ const x = startOfDay(d); x.setHours(h, m, 0, 0); return x; }

const inDayWindow   = (h) => h >= 6 && h < 22;
const inNightWindow = (h) => h >= 22 || h < 6;

// Cobra un intervalo dentro del MISMO día (considera diurno, nocturno y cruces 06/22)
function chargeSameDaySegment(segStart, segEnd){
  const sameDay = segStart.getFullYear() === segEnd.getFullYear()
               && segStart.getMonth() === segEnd.getMonth()
               && segStart.getDate() === segEnd.getDate();
  if (!sameDay) return null;

  const fecha = startOfDay(segStart).toISOString().slice(0,10);

  // Ventanas del día
  const six  = cutAt(segStart, 6, 0);
  const t22  = cutAt(segStart, 22, 0);

  // Particionamos en máximos tres sub-tramos homogéneos (noche / día / noche)
  const parts = [];
  // [segStart .. min(segEnd, 06:00)]
  if (segStart < six) {
    parts.push({ from: segStart, to: new Date(Math.min(+segEnd, +six)), rate: NIGHT_RATE });
  }
  // [max(segStart, 06:00) .. min(segEnd, 22:00)]
  if (segEnd > six && segStart < t22) {
    parts.push({ from: new Date(Math.max(+segStart, +six)), to: new Date(Math.min(+segEnd, +t22)), rate: DAY_RATE });
  }
  // [max(segStart, 22:00) .. segEnd]
  if (segEnd > t22) {
    parts.push({ from: new Date(Math.max(+segStart, +t22)), to: segEnd, rate: NIGHT_RATE });
  }

  // Cobro por subtramo: hora o fracción (ceil) con la tarifa del tramo
  let bruto = 0;
  for (const p of parts) {
    const mins = minutesBetween(p.from, p.to);
    if (mins > 0) {
      bruto += ceilHoursFromMinutes(mins) * p.rate;
    }
  }

  const totalDia = Math.min(bruto, DAILY_CAP);
  return { fecha, bruto: Number(bruto.toFixed(2)), totalDia: Number(totalDia.toFixed(2)) };
}

// Particiona [entrada..salida] en segmentos por día calendario
function splitByDays(entrada, salida){
  const out = [];
  let cur = entrada;
  while (cur < salida) {
    const dayEnd = endOfDay(cur);
    const segEnd = new Date(Math.min(+salida, +dayEnd));
    out.push([cur, segEnd]);
    // avanzar a siguiente día a las 00:00
    cur = new Date(+dayEnd + 1);
  }
  return out;
}

export function calcularTarifa({ entrada, salida, ticketPerdido=false }) {

  if (ticketPerdido) {
    return { total: 80, desglose: [], ticketPerdido: true };
  }
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

  // Si es el mismo día, cobramos directo
  const sameDay = start.getFullYear() === end.getFullYear()
               && start.getMonth() === end.getMonth()
               && start.getDate() === end.getDate();
  if (sameDay) {
    const d = chargeSameDaySegment(start, end);
    const total = Number(d.totalDia.toFixed(2));
    return { total, desglose: [d] };
  }

  // Multi-día: partimos por día y cobramos cada uno con tope diario
  const segments = splitByDays(start, end);
  const desglose = segments.map(([a,b]) => chargeSameDaySegment(a, b));
  const total = Number(desglose.reduce((acc, d) => acc + d.totalDia, 0).toFixed(2));

  return { total, desglose };
}