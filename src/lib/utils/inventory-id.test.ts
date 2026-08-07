import { describe, expect, it } from "vitest";

import type { Resguardo } from "@/lib/types/api";
import {
  formatInventoryId,
  getNextInventoryId,
  isValidInventoryId,
  parseInventorySequence,
  resolveInventoryId,
} from "@/lib/utils/inventory-id";

function resguardo(idInventario: string): Resguardo {
  return { idInventario } as Resguardo;
}

describe("inventory-id", () => {
  it("formatea el folio con prefijo y padding", () => {
    expect(formatInventoryId(1)).toBe("DGP-INV-0000001");
    expect(formatInventoryId(42)).toBe("DGP-INV-0000042");
  });

  it("valida el patron de inventario", () => {
    expect(isValidInventoryId("DGP-INV-0000001")).toBe(true);
    expect(isValidInventoryId("INV-1")).toBe(false);
    expect(isValidInventoryId("")).toBe(false);
  });

  it("extrae la secuencia numerica del folio", () => {
    expect(parseInventorySequence("DGP-INV-0000010")).toBe(10);
    expect(parseInventorySequence("malo")).toBeNull();
  });

  it("calcula el siguiente folio a partir del maximo existente", () => {
    expect(
      getNextInventoryId([
        resguardo("DGP-INV-0000003"),
        resguardo("DGP-INV-0000010"),
        resguardo("otro"),
      ]),
    ).toBe("DGP-INV-0000011");
  });

  it("resuelve preferiendo un candidato libre del cliente", () => {
    expect(
      resolveInventoryId("DGP-INV-0000005", [resguardo("DGP-INV-0000001")]),
    ).toBe("DGP-INV-0000005");
  });

  it("recalcula si el candidato esta tomado o es invalido", () => {
    expect(
      resolveInventoryId("DGP-INV-0000001", [resguardo("DGP-INV-0000001")]),
    ).toBe("DGP-INV-0000002");
    expect(resolveInventoryId("malo", [resguardo("DGP-INV-0000007")])).toBe(
      "DGP-INV-0000008",
    );
  });
});
