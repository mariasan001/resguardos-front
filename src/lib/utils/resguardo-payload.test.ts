import { describe, expect, it } from "vitest";

import {
  ESTADO_BAJA,
  ESTADO_ENTREGADO,
  ESTADO_MODIFICADO,
  mapPreviewDraftToResguardoPayload,
  resolveEstadoForUpdate,
} from "@/lib/utils/resguardo-payload";
import type { PreviewResguardoDraft } from "@/lib/types/api";

function buildDraft(
  overrides: Partial<PreviewResguardoDraft> = {},
): PreviewResguardoDraft {
  return {
    idInventario: "DGP-INV-0000001",
    marca: "Dell",
    marcaId: "1",
    referenciaInterna: "REF-1",
    fechaAsignacion: "2026-08-06",
    observaciones: "ok",
    telefono: "722",
    ip: "10.0.0.1",
    numeroSerie: "SN-1",
    mac: "AA:BB",
    idEstadoResguardo: "1",
    estadoLabel: "Entregado",
    tipoBienLabel: "CPU",
    modeloLabel: "X",
    sistemaOperativoLabel: "Windows",
    colorMaterialLabel: "Negro",
    procesadorLabel: "i5",
    usuarioTitularLabel: "Titular",
    usuarioResguardaLabel: "Resguarda",
    usuarioAsignaLabel: "Asigna",
    tipoBienId: "1",
    modeloId: "1",
    sistemaOperativoId: "1",
    colorMaterialId: "1",
    procesadorId: "1",
    usuarioTitularId: "T1",
    usuarioResguardaId: "R1",
    usuarioAsignaId: "A1",
    detalles: [
      {
        id: "d1",
        accesorioId: "12",
        accesorioLabel: "Monitor",
        numeroSerie: "SERIE-12",
      },
      {
        id: "d2",
        accesorioId: "13",
        accesorioLabel: "Teclado",
        numeroSerie: "SERIE-13",
      },
    ],
    ...overrides,
  };
}

describe("resolveEstadoForUpdate", () => {
  it("respeta Baja y fuerza Modificado en cualquier otro caso", () => {
    expect(resolveEstadoForUpdate(ESTADO_BAJA)).toBe(ESTADO_BAJA);
    expect(resolveEstadoForUpdate(ESTADO_ENTREGADO)).toBe(ESTADO_MODIFICADO);
    expect(resolveEstadoForUpdate(ESTADO_MODIFICADO)).toBe(ESTADO_MODIFICADO);
  });
});

describe("mapPreviewDraftToResguardoPayload", () => {
  it("en create conserva Entregado y manda detalles lean", () => {
    const payload = mapPreviewDraftToResguardoPayload(buildDraft(), {
      mode: "create",
    });

    expect(payload.idEstadoResguardo).toBe(ESTADO_ENTREGADO);
    expect(payload.usuarioModifica).toBeUndefined();
    expect(payload.detalles).toEqual([
      { accesorio: { id: 12 }, numeroSerie: "SERIE-12" },
      { accesorio: { id: 13 }, numeroSerie: "SERIE-13" },
    ]);
  });

  it("en update manda Modificado si no es Baja, con usuarioModifica", () => {
    const payload = mapPreviewDraftToResguardoPayload(
      buildDraft({ idEstadoResguardo: "1" }),
      { mode: "update", usuarioModifica: "admin" },
    );

    expect(payload.idEstadoResguardo).toBe(ESTADO_MODIFICADO);
    expect(payload.usuarioModifica).toBe("admin");
  });

  it("en update conserva Baja", () => {
    const payload = mapPreviewDraftToResguardoPayload(
      buildDraft({ idEstadoResguardo: "3" }),
      { mode: "update", usuarioModifica: "admin" },
    );

    expect(payload.idEstadoResguardo).toBe(ESTADO_BAJA);
  });
});
