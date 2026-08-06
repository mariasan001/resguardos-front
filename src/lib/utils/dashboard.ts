import type { Resguardo } from "@/lib/types/api";
import { getEstadoLabel } from "@/lib/utils/format";

export interface CountItem {
  label: string;
  value: number;
}

export type SeriesGranularity = "semana" | "mes" | "anio";

export type SeriesMetric = "altas" | "modificados" | "eliminados";

export const SERIES_METRIC_LABELS: Record<SeriesMetric, string> = {
  altas: "Dados de alta",
  modificados: "Modificados",
  eliminados: "Eliminados",
};

export interface SeriesPoint extends Record<SeriesMetric, number> {
  key: string;
  label: string;
  fullLabel: string;
}

export type ActivitySeries = Record<SeriesGranularity, SeriesPoint[]>;

interface BucketSeed {
  key: string;
  label: string;
  fullLabel: string;
}

const dayMonthFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
});
const longDayMonthFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
});
const monthFormatter = new Intl.DateTimeFormat("es-MX", { month: "short" });
const monthYearFormatter = new Intl.DateTimeFormat("es-MX", {
  month: "long",
  year: "numeric",
});

const ESTADOS_CONOCIDOS = [1, 2, 3];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEK_BUCKETS = { min: 8, max: 16 };
const MONTH_BUCKETS = { min: 6, max: 12 };
const YEAR_BUCKETS = { min: 3, max: 6 };

function cleanLabel(value: string) {
  return value.replace(/\./g, "");
}

function getDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function startOfWeek(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

function parseDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toPercentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export function countByEstadoId(resguardos: Resguardo[], estado: number) {
  return resguardos.filter((item) => item.idEstadoResguardo === estado).length;
}

export function countActiveHolders(resguardos: Resguardo[]) {
  const holders = new Set<string>();

  resguardos.forEach((resguardo) => {
    if (resguardo.idEstadoResguardo !== 1) {
      return;
    }

    const holder =
      resguardo.usuarioTitular?.neyemp?.trim() ||
      resguardo.usuarioTitular?.nombre?.trim();

    if (holder) {
      holders.add(holder);
    }
  });

  return holders.size;
}

export function countByEstado(resguardos: Resguardo[]): CountItem[] {
  const counts = ESTADOS_CONOCIDOS.map((estado) => ({
    label: getEstadoLabel(estado),
    value: resguardos.filter((item) => item.idEstadoResguardo === estado).length,
  }));

  const sinClasificar = resguardos.filter(
    (item) =>
      item.idEstadoResguardo === undefined ||
      !ESTADOS_CONOCIDOS.includes(item.idEstadoResguardo),
  ).length;

  return sinClasificar
    ? [...counts, { label: getEstadoLabel(undefined), value: sinClasificar }]
    : counts;
}

interface DateRange {
  first: Date;
  last: Date;
}

/**
 * La ventana se ancla en los datos y no solo en la fecha actual, de modo que los
 * registros antiguos o con fecha futura sigan contando en la grafica.
 */
function getRange(dates: Date[]): DateRange {
  const today = new Date();
  const times = [...dates.map((date) => date.getTime()), today.getTime()];

  return {
    first: new Date(Math.min(...times)),
    last: new Date(Math.max(...times)),
  };
}

function clampBuckets(span: number, limits: { min: number; max: number }) {
  return Math.min(Math.max(span, limits.min), limits.max);
}

function buildWeekSeeds(range: DateRange): BucketSeed[] {
  const lastWeek = startOfWeek(range.last);
  const firstWeek = startOfWeek(range.first);
  const span =
    Math.round((lastWeek.getTime() - firstWeek.getTime()) / WEEK_MS) + 1;
  const buckets = clampBuckets(span, WEEK_BUCKETS);
  const seeds: BucketSeed[] = [];

  for (let offset = buckets - 1; offset >= 0; offset -= 1) {
    const start = new Date(lastWeek);
    start.setDate(start.getDate() - offset * 7);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    seeds.push({
      key: getDayKey(start),
      label: cleanLabel(dayMonthFormatter.format(start)),
      fullLabel: `Semana del ${longDayMonthFormatter.format(start)} al ${longDayMonthFormatter.format(end)}`,
    });
  }

  return seeds;
}

function buildMonthSeeds(range: DateRange): BucketSeed[] {
  const lastIndex = range.last.getFullYear() * 12 + range.last.getMonth();
  const firstIndex = range.first.getFullYear() * 12 + range.first.getMonth();
  const buckets = clampBuckets(lastIndex - firstIndex + 1, MONTH_BUCKETS);
  const seeds: BucketSeed[] = [];

  for (let offset = buckets - 1; offset >= 0; offset -= 1) {
    const date = new Date(
      range.last.getFullYear(),
      range.last.getMonth() - offset,
      1,
    );

    seeds.push({
      key: getMonthKey(date),
      label: cleanLabel(monthFormatter.format(date)),
      fullLabel: monthYearFormatter.format(date),
    });
  }

  return seeds;
}

function buildYearSeeds(range: DateRange): BucketSeed[] {
  const lastYear = range.last.getFullYear();
  const buckets = clampBuckets(
    lastYear - range.first.getFullYear() + 1,
    YEAR_BUCKETS,
  );
  const seeds: BucketSeed[] = [];

  for (let offset = buckets - 1; offset >= 0; offset -= 1) {
    const key = String(lastYear - offset);
    seeds.push({ key, label: key, fullLabel: `Año ${key}` });
  }

  return seeds;
}

function buildPoints(
  seeds: BucketSeed[],
  keyOf: (date: Date) => string,
  datesByMetric: Record<SeriesMetric, Date[]>,
): SeriesPoint[] {
  const buckets = new Map<string, SeriesPoint>(
    seeds.map((seed) => [
      seed.key,
      { ...seed, altas: 0, modificados: 0, eliminados: 0 },
    ]),
  );

  (Object.keys(datesByMetric) as SeriesMetric[]).forEach((metric) => {
    datesByMetric[metric].forEach((date) => {
      const bucket = buckets.get(keyOf(date));

      if (bucket) {
        bucket[metric] += 1;
      }
    });
  });

  return [...buckets.values()];
}

function collectDates(
  resguardos: Resguardo[],
  matches: (resguardo: Resguardo) => boolean,
  dateOf: (resguardo: Resguardo) => string | undefined,
) {
  return resguardos
    .filter(matches)
    .map((resguardo) => parseDate(dateOf(resguardo)))
    .filter((date): date is Date => date !== null);
}

export function getResguardoFecha(resguardo: Resguardo) {
  return resguardo.fechaCreacion ?? resguardo.fechaAsignacion;
}

export function getAdscripcionLabel(resguardo: Resguardo) {
  return resguardo.usuarioTitular?.adscripcion?.desAds?.trim() || "";
}

export function matchesSeriesMetric(
  resguardo: Resguardo,
  metric: SeriesMetric,
) {
  if (metric === "altas") {
    return true;
  }

  if (metric === "modificados") {
    return resguardo.idEstadoResguardo === 2;
  }

  return resguardo.idEstadoResguardo === 3;
}

export function filterByAdscripcion(
  resguardos: Resguardo[],
  adscripcion: string | null,
) {
  if (!adscripcion) {
    return resguardos;
  }

  return resguardos.filter(
    (resguardo) => getAdscripcionLabel(resguardo) === adscripcion,
  );
}

export function filterBySeriesMetric(
  resguardos: Resguardo[],
  metric: SeriesMetric | null,
) {
  if (!metric) {
    return resguardos;
  }

  return resguardos.filter((resguardo) =>
    matchesSeriesMetric(resguardo, metric),
  );
}

function getMovimientoFecha(resguardo: Resguardo) {
  return resguardo.fechaDevolucion ?? getResguardoFecha(resguardo);
}

export function buildActivitySeries(resguardos: Resguardo[]): ActivitySeries {
  const datesByMetric: Record<SeriesMetric, Date[]> = {
    altas: collectDates(resguardos, () => true, getResguardoFecha),
    modificados: collectDates(
      resguardos,
      (resguardo) => resguardo.idEstadoResguardo === 2,
      getMovimientoFecha,
    ),
    eliminados: collectDates(
      resguardos,
      (resguardo) => resguardo.idEstadoResguardo === 3,
      getMovimientoFecha,
    ),
  };

  const range = getRange(Object.values(datesByMetric).flat());

  return {
    semana: buildPoints(
      buildWeekSeeds(range),
      (date) => getDayKey(startOfWeek(date)),
      datesByMetric,
    ),
    mes: buildPoints(buildMonthSeeds(range), getMonthKey, datesByMetric),
    anio: buildPoints(
      buildYearSeeds(range),
      (date) => String(date.getFullYear()),
      datesByMetric,
    ),
  };
}

export function rankBy(
  resguardos: Resguardo[],
  selector: (resguardo: Resguardo) => string | undefined = getAdscripcionLabel,
  limit = 5,
): CountItem[] {
  const counts = new Map<string, number>();

  resguardos.forEach((resguardo) => {
    const label = selector(resguardo)?.trim();

    if (!label) {
      return;
    }

    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort(
      (left, right) =>
        right.value - left.value ||
        left.label.localeCompare(right.label, "es-MX"),
    )
    .slice(0, limit);
}

export function getRecentResguardos(resguardos: Resguardo[], limit = 6) {
  return [...resguardos]
    .sort((left, right) => {
      const leftDate = parseDate(getResguardoFecha(left))?.getTime();
      const rightDate = parseDate(getResguardoFecha(right))?.getTime();

      return (rightDate ?? 0) - (leftDate ?? 0);
    })
    .slice(0, limit);
}
