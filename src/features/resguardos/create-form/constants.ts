import type { SectionKey } from "./types";

export const initialSectionValues = {
  idEstadoResguardo: "1",
};

export const REQUIRED_FORM_FIELDS: Array<{
  key: string;
  label: string;
  section: SectionKey;
}> = [
  { key: "marcaId", label: "Marca", section: "equipo" },
  { key: "tipoBienId", label: "Tipo de bien", section: "equipo" },
  { key: "modeloId", label: "Modelo", section: "equipo" },
  { key: "numeroSerie", label: "Numero de serie", section: "equipo" },
  { key: "procesadorId", label: "Procesador", section: "tecnico" },
  { key: "sistemaOperativoId", label: "Sistema operativo", section: "tecnico" },
  { key: "colorMaterialId", label: "Color o material", section: "tecnico" },
  { key: "ip", label: "IP", section: "tecnico" },
  { key: "usuarioTitularId", label: "Usuario titular", section: "responsable" },
  {
    key: "usuarioResguardaId",
    label: "Usuario que resguarda",
    section: "responsable",
  },
  { key: "referenciaInterna", label: "Referencia interna", section: "ubicacion" },
  { key: "telefono", label: "Telefono de contacto", section: "ubicacion" },
  { key: "fechaAsignacion", label: "Fecha de asignacion", section: "control" },
  { key: "idEstadoResguardo", label: "Estado", section: "control" },
  { key: "observaciones", label: "Observaciones", section: "extras" },
];

export const ESTADO_OPTIONS = [
  { value: "1", label: "Entregado" },
  { value: "2", label: "Modificado" },
  { value: "3", label: "Baja" },
];
