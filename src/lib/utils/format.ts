import type { AppUser, OptionItem, Resguardo } from "@/lib/types/api";

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDate(value?: string) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateFormatter.format(date);
}

export function formatText(value?: string, fallback = "Sin dato") {
  return value?.trim() ? value : fallback;
}

export function formatUserLabel(user: AppUser) {
  const name = formatText(user.nombre, "Usuario sin nombre");
  const key = formatText(user.neyemp, "Sin clave");
  return `${name} · ${key}`;
}

export function toUserOptions(users: AppUser[]): OptionItem[] {
  return users.map((user) => ({
    value: user.neyemp ?? "",
    label: formatUserLabel(user),
    helper: user.adscripcion?.desAds,
  }));
}

export function getEstadoLabel(value?: number) {
  switch (value) {
    case 1:
      return "Activo";
    case 2:
      return "Devuelto";
    case 3:
      return "Cancelado";
    default:
      return "Sin clasificar";
  }
}

export function filterResguardos(
  resguardos: Resguardo[],
  query: string,
  estado: string,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return resguardos.filter((resguardo) => {
    const matchesEstado =
      !estado || String(resguardo.idEstadoResguardo ?? "") === estado;

    const haystack = [
      resguardo.idInventario,
      resguardo.marca,
      resguardo.numeroSerie,
      resguardo.resguardo,
      resguardo.usuarioTitular?.nombre,
      resguardo.usuarioTitular?.neyemp,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesQuery =
      !normalizedQuery || haystack.includes(normalizedQuery);

    return matchesEstado && matchesQuery;
  });
}
