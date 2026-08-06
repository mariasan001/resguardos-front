import type { AppUser, CatMarca, OptionItem, Resguardo } from "@/lib/types/api";

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

/**
 * El backend serializa la marca como objeto de catalogo en unos endpoints y
 * como texto plano en otros, asi que se acepta cualquiera de las dos formas.
 */
export function getMarcaLabel(marca?: CatMarca | string | null) {
  if (!marca) {
    return "";
  }

  return (typeof marca === "string" ? marca : marca.descMarca ?? "").trim();
}

export function getMarcaId(
  marca?: CatMarca | string | null,
  idMarca?: number | null,
) {
  if (typeof idMarca === "number") {
    return String(idMarca);
  }

  if (marca && typeof marca !== "string" && typeof marca.id === "number") {
    return String(marca.id);
  }

  return "";
}

const LOWERCASE_WORDS = new Set([
  "a",
  "al",
  "con",
  "de",
  "del",
  "e",
  "el",
  "en",
  "la",
  "las",
  "los",
  "para",
  "por",
  "u",
  "y",
]);

/** Normaliza texto que puede venir todo en mayúsculas o minúsculas. */
export function formatTitleCase(value?: string, fallback = "Sin dato") {
  const trimmed = value?.trim();

  if (!trimmed) {
    return fallback;
  }

  return trimmed
    .toLocaleLowerCase("es-MX")
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && LOWERCASE_WORDS.has(word)) {
        return word;
      }

      return word.charAt(0).toLocaleUpperCase("es-MX") + word.slice(1);
    })
    .join(" ");
}

/**
 * Normaliza a "Primera letra mayuscula, resto en minusculas", sin importar
 * como lo haya escrito quien captura.
 */
export function formatSentenceCase(value: string) {
  const trimmed = value.trim().replace(/\s+/g, " ");

  if (!trimmed) {
    return "";
  }

  return (
    trimmed.charAt(0).toLocaleUpperCase("es-MX") +
    trimmed.slice(1).toLocaleLowerCase("es-MX")
  );
}

export function formatUserLabel(user: AppUser) {
  return formatTitleCase(user.nombre, "Usuario sin nombre");
}

export function toUserOption(user: AppUser): OptionItem {
  return {
    value: user.neyemp ?? "",
    label: formatUserLabel(user),
    helper: [
      user.neyemp,
      user.adscripcion?.desAds
        ? formatTitleCase(user.adscripcion.desAds)
        : null,
    ]
      .filter(Boolean)
      .join(" · "),
    email: user.email,
    searchText: [
      user.nombre,
      user.neyemp,
      user.email,
      user.adscripcion?.desAds,
      user.puesto?.des_neccat,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

export function toUserOptions(users: AppUser[]): OptionItem[] {
  return users.map(toUserOption);
}

export function mergeUserOptionsWithUpdatedUsers(
  options: OptionItem[],
  updatedUsers: Record<string, AppUser>,
) {
  const nextOptions = options.map((option) => {
    const updatedUser = updatedUsers[option.value];

    return updatedUser ? toUserOption(updatedUser) : option;
  });

  Object.values(updatedUsers).forEach((user) => {
    const neyemp = user.neyemp ?? "";

    if (!neyemp || nextOptions.some((option) => option.value === neyemp)) {
      return;
    }

    nextOptions.push(toUserOption(user));
  });

  return nextOptions;
}

export function getEstadoLabel(value?: number) {
  switch (value) {
    case 1:
      return "Entregado";
    case 2:
      return "Modificado";
    case 3:
      return "Baja";
    default:
      return "Sin clasificar";
  }
}

/** Convierte una fecha del backend a `yyyy-mm-dd` en horario local. */
export function toDateKey(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

export function filterResguardos(
  resguardos: Resguardo[],
  query: string,
  estado: string,
  filters: {
    titular?: string;
    adscripcion?: string;
    fechaAsignacion?: string;
    fechaActualizacion?: string;
  } = {},
) {
  const normalizedQuery = query.trim().toLowerCase();
  const titularQuery = filters.titular?.trim().toLowerCase() ?? "";
  const adscripcionQuery = filters.adscripcion?.trim().toLowerCase() ?? "";
  const asignacionQuery = filters.fechaAsignacion?.trim() ?? "";
  const actualizacionQuery = filters.fechaActualizacion?.trim() ?? "";

  return resguardos.filter((resguardo) => {
    const matchesEstado =
      !estado || String(resguardo.idEstadoResguardo ?? "") === estado;

    const titular = (resguardo.usuarioTitular?.nombre ?? "").toLowerCase();
    const adscripcion = (
      resguardo.usuarioTitular?.adscripcion?.desAds ?? ""
    ).toLowerCase();

    const matchesTitular = !titularQuery || titular.includes(titularQuery);
    const matchesAdscripcion =
      !adscripcionQuery || adscripcion.includes(adscripcionQuery);
    const matchesAsignacion =
      !asignacionQuery ||
      toDateKey(resguardo.fechaAsignacion) === asignacionQuery;
    const matchesActualizacion =
      !actualizacionQuery ||
      toDateKey(resguardo.fechaActualizacion) === actualizacionQuery;

    const haystack = [
      resguardo.idInventario,
      getMarcaLabel(resguardo.marca),
      resguardo.numeroSerie,
      resguardo.resguardo,
      resguardo.usuarioTitular?.nombre,
      resguardo.usuarioTitular?.neyemp,
      resguardo.usuarioTitular?.adscripcion?.desAds,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesQuery =
      !normalizedQuery || haystack.includes(normalizedQuery);

    return (
      matchesEstado &&
      matchesQuery &&
      matchesTitular &&
      matchesAdscripcion &&
      matchesAsignacion &&
      matchesActualizacion
    );
  });
}
