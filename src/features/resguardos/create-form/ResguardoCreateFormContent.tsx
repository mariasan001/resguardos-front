"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { findAssignerNeyemp } from "@/lib/constants/assigner";
import type { SelectOptionsSource } from "@/lib/types/api";
import { mergeUserOptionsWithUpdatedUsers } from "@/lib/utils/format";
import { writePreviewResguardoDraft } from "@/lib/utils/resguardo-draft";
import { useUpdatedUsersCache } from "@/lib/utils/use-updated-users-cache";
import styles from "@/features/resguardos/ResguardoCreateForm.module.css";

import { buildPreviewDraft } from "./build-preview-draft";
import { ESTADO_OPTIONS, initialSectionValues } from "./constants";
import { getSectionStatus, nextDetailId } from "./helpers";
import { ControlSection } from "./sections/ControlSection";
import { EquipoSection } from "./sections/EquipoSection";
import { ExtrasSection } from "./sections/ExtrasSection";
import { FormActions } from "./sections/FormActions";
import { ResponsableSection } from "./sections/ResponsableSection";
import { TecnicoSection } from "./sections/TecnicoSection";
import { UbicacionSection } from "./sections/UbicacionSection";
import type {
  DetalleItem,
  ResguardoCreateFormContentProps,
  SectionKey,
} from "./types";
import { collectValidationIssues } from "./validation";

export function ResguardoCreateFormContent({
  sources,
  cancelHref = "/resguardos",
  initialDraft,
  generatedInventoryId,
}: ResguardoCreateFormContentProps) {
  const router = useRouter();
  const [detalles, setDetalles] = useState<DetalleItem[]>(
    initialDraft?.detalles?.map((detalle) => ({
      id: detalle.id || nextDetailId(),
      detalleId: detalle.detalleId,
      accesorioId: detalle.accesorioId,
      numeroSerie: detalle.numeroSerie,
    })) ?? [],
  );
  const [openSection, setOpenSection] = useState<SectionKey>("equipo");
  const [formError, setFormError] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({
    ...initialSectionValues,
    idInventario: initialDraft?.idInventario ?? generatedInventoryId,
    marcaId: initialDraft?.marcaId ?? "",
    marca: initialDraft?.marca ?? "",
    referenciaInterna:
      initialDraft?.referenciaInterna ?? initialDraft?.resguardo ?? "",
    fechaAsignacion: initialDraft?.fechaAsignacion ?? "",
    observaciones: initialDraft?.observaciones ?? "",
    telefono: initialDraft?.telefono ?? "",
    ip: initialDraft?.ip ?? "",
    numeroSerie: initialDraft?.numeroSerie ?? "",
    mac: initialDraft?.mac ?? "",
    idEstadoResguardo:
      initialDraft?.idEstadoResguardo || initialSectionValues.idEstadoResguardo,
    tipoBienId: initialDraft?.tipoBienId ?? "",
    modeloId: initialDraft?.modeloId ?? "",
    sistemaOperativoId: initialDraft?.sistemaOperativoId ?? "",
    colorMaterialId: initialDraft?.colorMaterialId ?? "",
    procesadorId: initialDraft?.procesadorId ?? "",
    usuarioTitularId: initialDraft?.usuarioTitularId ?? "",
    usuarioResguardaId: initialDraft?.usuarioResguardaId ?? "",
  });
  const editingResguardoId = initialDraft?.editingResguardoId;
  const accesorios = sources.accesorios.options;
  const tiposBien = sources.tiposBien.options;
  const marcas = sources.marcas.options;
  const modelos = sources.modelos.options;
  const sistemasOperativos = sources.sistemasOperativos.options;
  const colores = sources.colores.options;
  const procesadores = sources.procesadores.options;
  const updatedUsers = useUpdatedUsersCache();
  const users = useMemo(
    () => mergeUserOptionsWithUpdatedUsers(sources.usuarios.options, updatedUsers),
    [sources.usuarios.options, updatedUsers],
  );
  const assignerNeyemp = useMemo(() => findAssignerNeyemp(users), [users]);
  const userOptionsSource = useMemo(
    () => ({
      ...sources.usuarios,
      options: users,
    }),
    [sources.usuarios, users],
  );
  const estadoOptionsSource: SelectOptionsSource = {
    state: "ready",
    options: ESTADO_OPTIONS,
  };

  function isFieldInvalid(key: string) {
    return invalidFields.includes(key);
  }

  function clearFieldInvalid(key: string) {
    setInvalidFields((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : current,
    );
  }

  function updateField(name: string, value: string) {
    clearFieldInvalid(name);
    setFormError("");
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateDetalle(
    id: string,
    key: "accesorioId" | "numeroSerie",
    value: string,
  ) {
    clearFieldInvalid(`detalle-${id}-${key}`);
    if (key === "accesorioId") {
      clearFieldInvalid(`detalle-${id}-marca`);
      clearFieldInvalid(`detalle-${id}-modelo`);
    }
    setFormError("");
    setDetalles((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    );
  }

  function addDetalle() {
    clearFieldInvalid("accesorios");
    setFormError("");
    setOpenSection("extras");
    setDetalles((current) => [
      ...current,
      {
        id: nextDetailId(),
        accesorioId: "",
        numeroSerie: "",
      },
    ]);
  }

  function removeDetalle(id: string) {
    setDetalles((current) => current.filter((item) => item.id !== id));
    setInvalidFields((current) =>
      current.filter(
        (key) =>
          key !== `detalle-${id}-accesorioId` &&
          key !== `detalle-${id}-numeroSerie` &&
          key !== `detalle-${id}-marca` &&
          key !== `detalle-${id}-modelo`,
      ),
    );
    setFormError("");
  }

  function continueToPreview() {
    const validationError = collectValidationIssues({
      formValues,
      detalles,
      accesorios,
    });

    if (validationError) {
      setFormError(validationError.message);
      setInvalidFields(validationError.invalidKeys);
      setOpenSection(validationError.section);
      return;
    }

    setFormError("");
    setInvalidFields([]);

    const draft = buildPreviewDraft({
      formValues,
      detalles,
      accesorios,
      marcas,
      tiposBien,
      modelos,
      sistemasOperativos,
      colores,
      procesadores,
      users,
      assignerNeyemp,
      editingResguardoId,
    });

    writePreviewResguardoDraft(draft);
    router.push("/resguardos/nuevo/preview");
  }

  const equipoStatus = getSectionStatus("equipo", formValues, detalles);
  const tecnicoStatus = getSectionStatus("tecnico", formValues, detalles);
  const responsableStatus = getSectionStatus("responsable", formValues, detalles);
  const ubicacionStatus = getSectionStatus("ubicacion", formValues, detalles);
  const controlStatus = getSectionStatus("control", formValues, detalles);
  const extrasStatus = getSectionStatus("extras", formValues, detalles);

  return (
    <div className={styles.form}>
      <EquipoSection
        openKey={openSection}
        onToggle={setOpenSection}
        status={equipoStatus}
        sources={sources}
        formValues={formValues}
        isFieldInvalid={isFieldInvalid}
        updateField={updateField}
      />
      <TecnicoSection
        openKey={openSection}
        onToggle={setOpenSection}
        status={tecnicoStatus}
        sources={sources}
        formValues={formValues}
        isFieldInvalid={isFieldInvalid}
        updateField={updateField}
      />
      <ResponsableSection
        openKey={openSection}
        onToggle={setOpenSection}
        status={responsableStatus}
        userOptionsSource={userOptionsSource}
        formValues={formValues}
        isFieldInvalid={isFieldInvalid}
        updateField={updateField}
      />
      <UbicacionSection
        openKey={openSection}
        onToggle={setOpenSection}
        status={ubicacionStatus}
        formValues={formValues}
        isFieldInvalid={isFieldInvalid}
        updateField={updateField}
      />
      <ControlSection
        openKey={openSection}
        onToggle={setOpenSection}
        status={controlStatus}
        estadoOptionsSource={estadoOptionsSource}
        formValues={formValues}
        isFieldInvalid={isFieldInvalid}
        updateField={updateField}
      />
      <ExtrasSection
        openKey={openSection}
        onToggle={setOpenSection}
        status={extrasStatus}
        sources={sources}
        accesorios={accesorios}
        formValues={formValues}
        detalles={detalles}
        isFieldInvalid={isFieldInvalid}
        updateField={updateField}
        updateDetalle={updateDetalle}
        addDetalle={addDetalle}
        removeDetalle={removeDetalle}
      />
      <FormActions
        cancelHref={cancelHref}
        formError={formError}
        editingResguardoId={editingResguardoId}
        onContinue={continueToPreview}
      />
    </div>
  );
}
