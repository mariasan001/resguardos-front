"use client";

import {
  Building2,
  ChevronsUpDown,
  CalendarClock,
  CircleX,
  Check,
  ChevronDown,
  Cpu,
  NotebookPen,
  Package2,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChangeEventHandler, ReactNode } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { FIXED_ASSIGN_USER_NAME, findAssignerNeyemp } from "@/lib/constants/assigner";
import type {
  OptionItem,
  PreviewAccesorioDraft,
  PreviewResguardoDraft,
  ResguardoCatalogSources,
  SelectOptionsSource,
} from "@/lib/types/api";
import { mergeUserOptionsWithUpdatedUsers } from "@/lib/utils/format";
import {
  clearPreviewResguardoDraft,
  getOptionLabel,
  writePreviewResguardoDraft,
} from "@/lib/utils/resguardo-draft";
import { useUpdatedUsersCache } from "@/lib/utils/use-updated-users-cache";
import {
  useIsHydrated,
  usePreviewResguardoDraft,
} from "@/lib/utils/use-preview-resguardo-draft";
import FormDatePicker from "@/features/resguardos/FormDatePicker";
import FormSelect from "@/features/resguardos/FormSelect";
import styles from "@/features/resguardos/ResguardoCreateForm.module.css";

const initialSectionValues = {
  idEstadoResguardo: "1",
};

type SectionKey =
  | "equipo"
  | "tecnico"
  | "responsable"
  | "ubicacion"
  | "control"
  | "extras";

interface DetalleItem {
  id: string;
  accesorioId: string;
  numeroSerie: string;
}

interface ResguardoCreateFormProps {
  sources: ResguardoCatalogSources;
  cancelHref?: string;
  preserveDraft?: boolean;
  serverDraft?: PreviewResguardoDraft | null;
  generatedInventoryId: string;
}

interface ResguardoCreateFormContentProps extends ResguardoCreateFormProps {
  initialDraft: PreviewResguardoDraft | null;
}

interface BaseFieldProps {
  label: string;
  name: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
  span?: "full" | "half" | "third" | "quarter" | "twoThirds";
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className={styles.label}>
      {label}
      {required ? (
        <span className={styles.requiredMark} aria-hidden="true">
          {" "}
          *
        </span>
      ) : null}
    </span>
  );
}

const REQUIRED_FORM_FIELDS: Array<{
  key: string;
  label: string;
  section: SectionKey;
}> = [
  { key: "idInventario", label: "Inventario", section: "equipo" },
  { key: "marcaId", label: "Marca", section: "equipo" },
  { key: "tipoBienId", label: "Tipo de bien", section: "equipo" },
  { key: "modeloId", label: "Modelo", section: "equipo" },
  { key: "numeroSerie", label: "Numero de serie", section: "equipo" },
  { key: "procesadorId", label: "Procesador", section: "tecnico" },
  { key: "sistemaOperativoId", label: "Sistema operativo", section: "tecnico" },
  { key: "colorMaterialId", label: "Color o material", section: "tecnico" },
  { key: "ip", label: "IP", section: "tecnico" },
  { key: "mac", label: "MAC", section: "tecnico" },
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

function nextDetailId() {
  return globalThis.crypto?.randomUUID?.() ?? `detalle-${Date.now()}-${Math.random()}`;
}

function getSpanClass(span: BaseFieldProps["span"]) {
  switch (span) {
    case "half":
      return styles.spanHalf;
    case "third":
      return styles.spanThird;
    case "quarter":
      return styles.spanQuarter;
    case "twoThirds":
      return styles.spanTwoThirds;
    case "full":
    default:
      return styles.spanFull;
  }
}

function getCount(values: Record<string, string>, keys: string[]) {
  return keys.filter((key) => values[key]?.trim()).length;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function getSectionStatus(
  section: SectionKey,
  values: Record<string, string>,
  details: DetalleItem[],
) {
  switch (section) {
    case "equipo":
      return {
        completed: getCount(values, [
          "idInventario",
          "marcaId",
          "tipoBienId",
          "modeloId",
          "numeroSerie",
        ]),
        total: 5,
      };
    case "tecnico":
      return {
        completed: getCount(values, [
          "procesadorId",
          "sistemaOperativoId",
          "colorMaterialId",
          "ip",
          "mac",
        ]),
        total: 5,
      };
    case "responsable":
      return {
        completed:
          getCount(values, ["usuarioTitularId", "usuarioResguardaId"]) + 1,
        total: 3,
      };
    case "ubicacion":
      return {
        completed: getCount(values, ["telefono", "referenciaInterna"]),
        total: 2,
      };
    case "control":
      return {
        completed: getCount(values, ["fechaAsignacion", "idEstadoResguardo"]),
        total: 2,
      };
    case "extras": {
      const hasNotes = Boolean(values.observaciones?.trim());
      const completeAccessories = details.filter(
        (detail) => detail.accesorioId.trim() && detail.numeroSerie.trim(),
      );
      const hasAccessories =
        details.length > 0 && completeAccessories.length === details.length;
      return {
        completed: Number(hasNotes) + Number(hasAccessories),
        total: 2,
      };
    }
    default:
      return {
        completed: 0,
        total: 0,
      };
  }
}

function getAccesorioOption(accesorios: OptionItem[], accesorioId: string) {
  return accesorios.find((item) => item.value === accesorioId);
}

/** La marca y el modelo del accesorio vienen del catalogo, no se capturan aqui. */
function toDraftDetalles(
  detalles: DetalleItem[],
  accesorios: OptionItem[],
): PreviewAccesorioDraft[] {
  return detalles.map((detalle) => {
    const option = getAccesorioOption(accesorios, detalle.accesorioId);

    return {
      id: detalle.id,
      accesorioId: detalle.accesorioId,
      accesorioLabel: option?.label ?? "",
      marcaId: option?.marcaId ?? "",
      marcaLabel: option?.marca ?? "",
      modeloLabel: option?.modelo ?? "",
      numeroSerie: detalle.numeroSerie,
    };
  });
}

function Section({
  icon,
  title,
  description,
  sectionKey,
  openKey,
  onToggle,
  status,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  sectionKey: SectionKey;
  openKey: SectionKey;
  onToggle: (section: SectionKey) => void;
  status: { completed: number; total: number };
  children: ReactNode;
}) {
  const isOpen = openKey === sectionKey;
  const isComplete = status.total > 0 && status.completed === status.total;

  return (
    <section
      data-motion-item
      className={`${styles.section} ${isOpen ? styles.sectionOpen : ""} ${
        isComplete ? styles.sectionComplete : ""
      }`}
    >
      <button
        type="button"
        className={styles.sectionSummary}
        onClick={() => onToggle(sectionKey)}
        aria-expanded={isOpen}
      >
        <div className={styles.sectionMeta}>
          <span className={styles.sectionIcon}>{icon}</span>
          <div className={styles.sectionCopy}>
            <h2 className={styles.sectionTitle}>{title}</h2>
            <p className={styles.sectionText}>{description}</p>
          </div>
        </div>
        <div className={styles.sectionTools}>
          <span className={isComplete ? styles.completeBadge : styles.countBadge}>
            {isComplete ? (
              <>
                <Check size={12} strokeWidth={2.2} />
                Completo
              </>
            ) : (
              `${status.completed}/${status.total} campos`
            )}
          </span>
          <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}>
            <ChevronDown size={16} strokeWidth={1.9} />
          </span>
        </div>
      </button>

      {isOpen ? <div className={styles.sectionBody}>{children}</div> : null}
    </section>
  );
}

export default function ResguardoCreateForm(props: ResguardoCreateFormProps) {
  const { preserveDraft = false, serverDraft = null } = props;
  const hydrated = useIsHydrated();
  const draft = usePreviewResguardoDraft();
  const effectiveDraft = serverDraft ?? (preserveDraft ? draft : null);
  const formKey = serverDraft
    ? `edit-${serverDraft.editingResguardoId ?? "draft"}`
    : hydrated && effectiveDraft
      ? "draft-loaded"
      : "draft-empty";

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (serverDraft) {
      // El resguardo recien cargado reemplaza cualquier borrador anterior.
      writePreviewResguardoDraft(serverDraft);
      return;
    }

    if (preserveDraft) {
      return;
    }

    clearPreviewResguardoDraft();
  }, [hydrated, preserveDraft, serverDraft]);

  return (
    <ResguardoCreateFormContent
      key={formKey}
      {...props}
      initialDraft={serverDraft ?? (hydrated ? effectiveDraft : null)}
    />
  );
}

function ResguardoCreateFormContent({
  sources,
  cancelHref = "/resguardos",
  initialDraft,
  generatedInventoryId,
}: ResguardoCreateFormContentProps) {
  const router = useRouter();
  const [detalles, setDetalles] = useState<DetalleItem[]>(
    initialDraft?.detalles?.map((detalle) => ({
      id: detalle.id || nextDetailId(),
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
    options: [
      { value: "1", label: "Entregado" },
      { value: "2", label: "Modificado" },
      { value: "3", label: "Baja" },
    ],
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

  function collectValidationIssues(): {
    message: string;
    section: SectionKey;
    invalidKeys: string[];
  } | null {
    const invalidKeys: string[] = [];
    let firstSection: SectionKey | null = null;
    let firstMessage = "";

    for (const field of REQUIRED_FORM_FIELDS) {
      if (!(formValues[field.key] ?? "").trim()) {
        invalidKeys.push(field.key);

        if (!firstSection) {
          firstSection = field.section;
          firstMessage = `Completa los campos obligatorios marcados.`;
        }
      }
    }

    if (detalles.length === 0) {
      invalidKeys.push("accesorios");

      if (!firstSection) {
        firstSection = "extras";
        firstMessage = "Agrega al menos un accesorio con serie.";
      }
    }

    for (const [index, detalle] of detalles.entries()) {
      const position = index + 1;

      if (!detalle.accesorioId.trim()) {
        invalidKeys.push(`detalle-${detalle.id}-accesorioId`);

        if (!firstSection) {
          firstSection = "extras";
          firstMessage = `Selecciona el accesorio ${position}.`;
        }
      }

      if (!detalle.numeroSerie.trim()) {
        invalidKeys.push(`detalle-${detalle.id}-numeroSerie`);

        if (!firstSection) {
          firstSection = "extras";
          firstMessage = `Captura la serie del accesorio ${position}.`;
        }
      }

      const option = getAccesorioOption(accesorios, detalle.accesorioId);

      if (detalle.accesorioId.trim() && !option?.marca?.trim()) {
        invalidKeys.push(`detalle-${detalle.id}-marca`);

        if (!firstSection) {
          firstSection = "extras";
          firstMessage = `El accesorio ${position} no tiene marca en el catalogo.`;
        }
      }

      if (detalle.accesorioId.trim() && !option?.modelo?.trim()) {
        invalidKeys.push(`detalle-${detalle.id}-modelo`);

        if (!firstSection) {
          firstSection = "extras";
          firstMessage = `El accesorio ${position} no tiene modelo en el catalogo.`;
        }
      }
    }

    if (!invalidKeys.length || !firstSection) {
      return null;
    }

    return {
      message:
        invalidKeys.length > 1
          ? "Completa los campos obligatorios marcados."
          : firstMessage,
      section: firstSection,
      invalidKeys,
    };
  }

  function continueToPreview() {
    const validationError = collectValidationIssues();

    if (validationError) {
      setFormError(validationError.message);
      setInvalidFields(validationError.invalidKeys);
      setOpenSection(validationError.section);
      return;
    }

    setFormError("");
    setInvalidFields([]);

    const draft: PreviewResguardoDraft = {
      idInventario: formValues.idInventario ?? "",
      marcaId: formValues.marcaId ?? "",
      marca: getOptionLabel(marcas, formValues.marcaId) || formValues.marca || "",
      referenciaInterna: formValues.referenciaInterna ?? "",
      fechaAsignacion: formValues.fechaAsignacion ?? "",
      observaciones: formValues.observaciones ?? "",
      telefono: formValues.telefono ?? "",
      ip: formValues.ip ?? "",
      numeroSerie: formValues.numeroSerie ?? "",
      mac: formValues.mac ?? "",
      idEstadoResguardo: formValues.idEstadoResguardo ?? "1",
      estadoLabel:
        getOptionLabel(
          [
            { value: "1", label: "Entregado" },
            { value: "2", label: "Modificado" },
            { value: "3", label: "Baja" },
          ],
          formValues.idEstadoResguardo ?? "1",
        ) || "Entregado",
      tipoBienLabel: getOptionLabel(tiposBien, formValues.tipoBienId),
      modeloLabel: getOptionLabel(modelos, formValues.modeloId),
      sistemaOperativoLabel: getOptionLabel(
        sistemasOperativos,
        formValues.sistemaOperativoId,
      ),
      colorMaterialLabel: getOptionLabel(colores, formValues.colorMaterialId),
      procesadorLabel: getOptionLabel(procesadores, formValues.procesadorId),
      usuarioTitularLabel: getOptionLabel(users, formValues.usuarioTitularId),
      usuarioTitularHelper:
        users.find((option) => option.value === formValues.usuarioTitularId)?.helper ?? "",
      usuarioTitularEmail:
        users.find((option) => option.value === formValues.usuarioTitularId)?.email ?? "",
      usuarioResguardaLabel: getOptionLabel(users, formValues.usuarioResguardaId),
      usuarioResguardaHelper:
        users.find((option) => option.value === formValues.usuarioResguardaId)?.helper ?? "",
      usuarioAsignaLabel: FIXED_ASSIGN_USER_NAME,
      usuarioAsignaHelper: "Asignador predeterminado",
      tipoBienId: formValues.tipoBienId ?? "",
      modeloId: formValues.modeloId ?? "",
      sistemaOperativoId: formValues.sistemaOperativoId ?? "",
      colorMaterialId: formValues.colorMaterialId ?? "",
      procesadorId: formValues.procesadorId ?? "",
      usuarioTitularId: formValues.usuarioTitularId ?? "",
      usuarioResguardaId: formValues.usuarioResguardaId ?? "",
      usuarioAsignaId: assignerNeyemp,
      editingResguardoId,
      detalles: toDraftDetalles(detalles, accesorios),
    };

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
      <Section
        icon={<Package2 size={16} strokeWidth={1.9} />}
        title="Datos del equipo"
        description="Identificacion principal del equipo."
        sectionKey="equipo"
        openKey={openSection}
        onToggle={setOpenSection}
        status={equipoStatus}
      >
        <div className={styles.grid}>
          <Field
            label="Inventario"
            name="idInventario"
            value={formValues.idInventario ?? ""}
            span="third"
            required
            invalid={isFieldInvalid("idInventario")}
            readOnly
          />
          <SelectField
            label="Marca"
            name="marcaId"
            source={sources.marcas}
            value={formValues.marcaId ?? ""}
            span="third"
            required
            invalid={isFieldInvalid("marcaId")}
            onChange={(event) => updateField("marcaId", event.target.value)}
          />
          <SelectField
            label="Tipo de bien"
            name="tipoBienId"
            source={sources.tiposBien}
            value={formValues.tipoBienId ?? ""}
            span="third"
            required
            invalid={isFieldInvalid("tipoBienId")}
            onChange={(event) => updateField("tipoBienId", event.target.value)}
          />
          <SelectField
            label="Modelo"
            name="modeloId"
            source={sources.modelos}
            value={formValues.modeloId ?? ""}
            span="third"
            required
            invalid={isFieldInvalid("modeloId")}
            onChange={(event) => updateField("modeloId", event.target.value)}
          />
          <Field
            label="Numero de serie"
            name="numeroSerie"
            value={formValues.numeroSerie ?? ""}
            span="third"
            required
            invalid={isFieldInvalid("numeroSerie")}
            onChange={(event) => updateField("numeroSerie", event.target.value)}
          />
        </div>
      </Section>

      <Section
        icon={<Cpu size={16} strokeWidth={1.9} />}
        title="Especificaciones tecnicas"
        description="Datos tecnicos y de conectividad."
        sectionKey="tecnico"
        openKey={openSection}
        onToggle={setOpenSection}
        status={tecnicoStatus}
      >
        <div className={styles.grid}>
          <SelectField
            label="Procesador"
            name="procesadorId"
            source={sources.procesadores}
            value={formValues.procesadorId ?? ""}
            span="half"
            required
            invalid={isFieldInvalid("procesadorId")}
            onChange={(event) => updateField("procesadorId", event.target.value)}
          />
          <SelectField
            label="Sistema operativo"
            name="sistemaOperativoId"
            source={sources.sistemasOperativos}
            value={formValues.sistemaOperativoId ?? ""}
            span="half"
            required
            invalid={isFieldInvalid("sistemaOperativoId")}
            onChange={(event) =>
              updateField("sistemaOperativoId", event.target.value)
            }
          />
          <SelectField
            label="Color o material"
            name="colorMaterialId"
            source={sources.colores}
            value={formValues.colorMaterialId ?? ""}
            span="half"
            required
            invalid={isFieldInvalid("colorMaterialId")}
            onChange={(event) => updateField("colorMaterialId", event.target.value)}
          />
          <Field
            label="IP"
            name="ip"
            value={formValues.ip ?? ""}
            span="quarter"
            placeholder="192.168.0.10"
            required
            invalid={isFieldInvalid("ip")}
            onChange={(event) => updateField("ip", event.target.value)}
          />
          <Field
            label="MAC"
            name="mac"
            value={formValues.mac ?? ""}
            span="quarter"
            placeholder="00:00:00:00:00:00"
            required
            invalid={isFieldInvalid("mac")}
            onChange={(event) => updateField("mac", event.target.value)}
          />
        </div>
      </Section>

      <Section
        icon={<UserRound size={16} strokeWidth={1.9} />}
        title="Datos del responsable"
        description="Personas relacionadas con el resguardo."
        sectionKey="responsable"
        openKey={openSection}
        onToggle={setOpenSection}
        status={responsableStatus}
      >
        <div className={styles.grid}>
          <UserComboboxField
            label="Usuario titular"
            name="usuarioTitularId"
            source={userOptionsSource}
            value={formValues.usuarioTitularId ?? ""}
            span="half"
            required
            invalid={isFieldInvalid("usuarioTitularId")}
            onChange={(event) => updateField("usuarioTitularId", event.target.value)}
          />
          <UserComboboxField
            label="Usuario que resguarda"
            name="usuarioResguardaId"
            source={userOptionsSource}
            value={formValues.usuarioResguardaId ?? ""}
            span="half"
            required
            invalid={isFieldInvalid("usuarioResguardaId")}
            onChange={(event) =>
              updateField("usuarioResguardaId", event.target.value)
            }
          />
          <StaticUserField
            label="Usuario que asigna"
            value={FIXED_ASSIGN_USER_NAME}
            helper="Asignador predeterminado"
            span="half"
            required
          />
        </div>
      </Section>

      <Section
        icon={<Building2 size={16} strokeWidth={1.9} />}
        title="Ubicacion y asignacion"
        description="Datos de referencia para control interno."
        sectionKey="ubicacion"
        openKey={openSection}
        onToggle={setOpenSection}
        status={ubicacionStatus}
      >
        <div className={styles.grid}>
          <Field
            label="Referencia interna"
            name="referenciaInterna"
            value={formValues.referenciaInterna ?? ""}
            span="half"
            placeholder="Referencia de area o control interno"
            required
            invalid={isFieldInvalid("referenciaInterna")}
            onChange={(event) => updateField("referenciaInterna", event.target.value)}
          />
          <Field
            label="Telefono de contacto"
            name="telefono"
            value={formValues.telefono ?? ""}
            span="half"
            placeholder="5551234567"
            required
            invalid={isFieldInvalid("telefono")}
            onChange={(event) => updateField("telefono", event.target.value)}
          />
        </div>
      </Section>

      <Section
        icon={<CalendarClock size={16} strokeWidth={1.9} />}
        title="Fechas y control"
        description="Fecha de asignacion y estatus administrativo."
        sectionKey="control"
        openKey={openSection}
        onToggle={setOpenSection}
        status={controlStatus}
      >
        <div className={styles.grid}>
          <FormDatePicker
            label="Fecha de asignacion"
            name="fechaAsignacion"
            value={formValues.fechaAsignacion ?? ""}
            className={styles.spanHalf}
            required
            invalid={isFieldInvalid("fechaAsignacion")}
            onChange={(nextValue) => updateField("fechaAsignacion", nextValue)}
          />
          <SelectField
            label="Estado"
            name="idEstadoResguardo"
            source={estadoOptionsSource}
            value={formValues.idEstadoResguardo ?? "1"}
            span="quarter"
            required
            invalid={isFieldInvalid("idEstadoResguardo")}
            onChange={(event) => updateField("idEstadoResguardo", event.target.value)}
          />
        </div>
      </Section>

      <Section
        icon={<NotebookPen size={16} strokeWidth={1.9} />}
        title="Observaciones y extras"
        description="Accesorios y notas de seguimiento."
        sectionKey="extras"
        openKey={openSection}
        onToggle={setOpenSection}
        status={extrasStatus}
      >
        <label className={`${styles.fieldBlock} ${styles.spanFull}`}>
          <FieldLabel label="Observaciones" required />
          <textarea
            className={`${styles.textarea} ${
              isFieldInvalid("observaciones") ? styles.inputInvalid : ""
            }`}
            name="observaciones"
            rows={4}
            required
            aria-invalid={isFieldInvalid("observaciones") || undefined}
            value={formValues.observaciones ?? ""}
            placeholder="Notas relevantes del resguardo."
            onChange={(event) => updateField("observaciones", event.target.value)}
          />
        </label>

        <div className={`${styles.detailBlock} ${styles.spanFull}`}>
          <div className={styles.detailHeader}>
            <div className={styles.detailHeaderCopy}>
              <span className={styles.detailHeaderTitle}>
                Accesorios
                <span className={styles.requiredMark} aria-hidden="true">
                  {" "}
                  *
                </span>
              </span>
              <span className={styles.detailHeaderHint}>
                {detalles.length
                  ? `${detalles.length} accesorio${detalles.length === 1 ? "" : "s"} agregado${
                      detalles.length === 1 ? "" : "s"
                    }.`
                  : "Agrega al menos un accesorio con su serie."}
              </span>
            </div>
            <button
              type="button"
              className={styles.detailAddButton}
              onClick={addDetalle}
            >
              <Plus size={15} strokeWidth={2.2} />
              Nuevo accesorio
            </button>
          </div>

          {detalles.length ? (
            <div className={styles.detailList}>
              {detalles.map((detalle, index) => (
                <article key={detalle.id} className={styles.detailCard} data-motion-item>
                  <header className={styles.detailCardHeader}>
                    <span className={styles.detailIndex}>{index + 1}</span>
                    <span className={styles.detailCardTitle}>
                      {getOptionLabel(accesorios, detalle.accesorioId) ||
                        "Accesorio sin definir"}
                    </span>
                    <button
                      type="button"
                      className={styles.removeIconButton}
                      onClick={() => removeDetalle(detalle.id)}
                      aria-label={`Quitar accesorio ${index + 1}`}
                      title="Quitar accesorio"
                    >
                      <Trash2 size={15} strokeWidth={1.9} />
                    </button>
                  </header>

                  <div className={styles.detailCardBody}>
                    <SelectField
                      label="Accesorio"
                      name={`detalle-accesorio-${index}`}
                      source={sources.accesorios}
                      value={detalle.accesorioId}
                      required
                      invalid={isFieldInvalid(`detalle-${detalle.id}-accesorioId`)}
                      onChange={(event) =>
                        updateDetalle(detalle.id, "accesorioId", event.target.value)
                      }
                      span="half"
                    />
                    <Field
                      label="Serie del accesorio"
                      name={`detalle-serie-${index}`}
                      value={detalle.numeroSerie}
                      placeholder="Numero de serie"
                      required
                      invalid={isFieldInvalid(`detalle-${detalle.id}-numeroSerie`)}
                      onChange={(event) =>
                        updateDetalle(detalle.id, "numeroSerie", event.target.value)
                      }
                      span="half"
                    />
                    <StaticUserField
                      label="Marca"
                      value={
                        getAccesorioOption(accesorios, detalle.accesorioId)?.marca ||
                        "Sin marca en el catalogo"
                      }
                      span="half"
                      required
                      invalid={isFieldInvalid(`detalle-${detalle.id}-marca`)}
                    />
                    <StaticUserField
                      label="Modelo"
                      value={
                        getAccesorioOption(accesorios, detalle.accesorioId)?.modelo ||
                        "Sin modelo en el catalogo"
                      }
                      span="half"
                      required
                      invalid={isFieldInvalid(`detalle-${detalle.id}-modelo`)}
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <button
              type="button"
              className={`${styles.detailEmptyCard} ${
                isFieldInvalid("accesorios") ? styles.detailEmptyCardInvalid : ""
              }`}
              onClick={addDetalle}
              data-motion-item
            >
              <span className={styles.detailAddIcon}>
                <Plus size={18} strokeWidth={2} />
              </span>
              <span className={styles.detailAddLabel}>Agregar el primer accesorio</span>
              <span className={styles.emptyAccessories}>
                Elige el accesorio del catalogo; su marca y modelo se completan solos
                y tu capturas la serie.
              </span>
            </button>
          )}
        </div>
      </Section>

      <div className={styles.actions} data-motion-item>
        {formError ? <p className={styles.formError}>{formError}</p> : null}
        <Link href={cancelHref} className={styles.cancelLink}>
          Cancelar
        </Link>
        <button type="button" className={styles.primaryButton} onClick={continueToPreview}>
          {editingResguardoId ? "Revisar cambios" : "Revisar resguardo"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  defaultValue,
  placeholder,
  readOnly,
  required,
  invalid,
  span = "full",
  onChange,
}: BaseFieldProps) {
  return (
    <label className={`${styles.fieldBlock} ${getSpanClass(span)}`}>
      <FieldLabel label={label} required={required} />
      <input
        className={`${styles.input} ${invalid ? styles.inputInvalid : ""}`}
        name={name}
        placeholder={placeholder}
        onChange={onChange}
        readOnly={readOnly}
        required={required}
        aria-invalid={invalid || undefined}
        aria-readonly={readOnly || undefined}
        {...(value !== undefined ? { value } : {})}
        {...(defaultValue !== undefined ? { defaultValue } : {})}
      />
    </label>
  );
}

function StaticUserField({
  label,
  value,
  helper,
  span = "full",
  required,
  invalid,
}: {
  label: string;
  value: string;
  helper?: string;
  span?: BaseFieldProps["span"];
  required?: boolean;
  invalid?: boolean;
}) {
  return (
    <label className={`${styles.fieldBlock} ${getSpanClass(span)}`}>
      <FieldLabel label={label} required={required} />
      <div
        className={`${styles.staticUserField} ${
          invalid ? styles.staticUserFieldInvalid : ""
        }`}
      >
        <span className={styles.staticUserValue}>{value}</span>
      </div>
      {helper ? <span className={styles.fieldHint}>{helper}</span> : null}
    </label>
  );
}

interface SelectFieldProps extends BaseFieldProps {
  source: SelectOptionsSource;
}

function SelectField({
  label,
  name,
  source,
  value,
  span = "full",
  required,
  invalid,
  onChange,
}: SelectFieldProps) {
  return (
    <FormSelect
      label={label}
      name={name}
      source={source}
      value={value ?? ""}
      required={required}
      invalid={invalid}
      className={getSpanClass(span)}
      onChange={(nextValue) =>
        onChange?.({ target: { value: nextValue, name } } as never)
      }
    />
  );
}

function UserComboboxField({
  label,
  name,
  source,
  value,
  span = "full",
  required,
  invalid,
  onChange,
}: SelectFieldProps) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const wrapperRef = useRef<HTMLLabelElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const selectedOption = source.options.find((option) => option.value === value) ?? null;
  const normalizedQuery = normalizeSearch(query);

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) {
      return source.options.slice(0, 10);
    }

    return source.options
      .filter((option) => {
        const haystack = option.searchText
          ? normalizeSearch(option.searchText)
          : normalizeSearch(`${option.label} ${option.helper ?? ""} ${option.email ?? ""}`);
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 10);
  }, [normalizedQuery, source.options]);

  const displayValue = isOpen ? query : selectedOption?.label ?? query;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function emitValueChange(nextValue: string) {
    onChange?.({
      target: { value: nextValue, name },
    } as never);
  }

  function commitSelection(option: OptionItem) {
    emitValueChange(option.value);
    setIsOpen(false);
    setQuery("");
    setActiveIndex(-1);
    inputRef.current?.blur();
  }

  function clearSelection() {
    emitValueChange("");
    setQuery("");
    setActiveIndex(-1);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setIsOpen(true);
      setActiveIndex(0);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        Math.min(current + 1, filteredOptions.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && isOpen && activeIndex >= 0) {
      event.preventDefault();
      const option = filteredOptions[activeIndex];
      if (option) {
        commitSelection(option);
      }
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setQuery("");
      setActiveIndex(-1);
    }
  }

  const isUnavailable = source.state !== "ready";

  return (
    <label
      ref={wrapperRef}
      className={`${styles.fieldBlock} ${getSpanClass(span)}`}
    >
      <FieldLabel label={label} required={required} />
      <div
        className={`${styles.combobox} ${isOpen ? styles.comboboxOpen : ""} ${
          isUnavailable ? styles.comboboxDisabled : ""
        } ${invalid ? styles.comboboxInvalid : ""}`}
      >
        <input
          ref={inputRef}
          id={inputId}
          className={styles.comboboxInput}
          type="text"
          role="combobox"
          name={`${name}-search`}
          autoComplete="off"
          placeholder="Buscar por nombre o numero de servidor publico"
          value={displayValue}
          disabled={isUnavailable}
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
          }
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
        />

        {selectedOption ? (
          <button
            type="button"
            className={styles.comboboxClear}
            onClick={clearSelection}
            aria-label={`Limpiar ${label.toLowerCase()}`}
          >
            <CircleX size={16} strokeWidth={1.8} />
          </button>
        ) : null}

        <span className={styles.comboboxChevron}>
          <ChevronsUpDown size={16} strokeWidth={1.8} />
        </span>

        {isOpen && !isUnavailable ? (
          <div className={styles.comboboxPopover}>
            {filteredOptions.length ? (
              <ul id={listboxId} className={styles.comboboxList} role="listbox">
                {filteredOptions.map((option, index) => (
                  <li key={`${name}-${option.value}`}>
                    <button
                      id={`${listboxId}-${index}`}
                      type="button"
                      role="option"
                      aria-selected={option.value === value}
                      className={`${styles.comboboxOption} ${
                        index === activeIndex ? styles.comboboxOptionActive : ""
                      }`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => commitSelection(option)}
                    >
                      <span className={styles.comboboxPrimary}>{option.label}</span>
                      {option.helper ? (
                        <span className={styles.comboboxSecondary}>{option.helper}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.comboboxEmpty}>No se encontraron usuarios</div>
            )}
          </div>
        ) : null}
      </div>
      {source.message ? (
        <span
          className={`${styles.fieldHint} ${
            source.state === "error" ? styles.fieldHintError : ""
          }`}
        >
          {source.message}
        </span>
      ) : null}
    </label>
  );
}
