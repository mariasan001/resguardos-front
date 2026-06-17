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
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChangeEventHandler, ReactNode } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import type {
  OptionItem,
  PreviewAccesorioDraft,
  PreviewResguardoDraft,
  ResguardoCatalogSources,
  SelectOptionsSource,
} from "@/lib/types/api";
import {
  getOptionLabel,
  writePreviewResguardoDraft,
} from "@/lib/utils/resguardo-draft";
import {
  useIsHydrated,
  usePreviewResguardoDraft,
} from "@/lib/utils/use-preview-resguardo-draft";
import styles from "@/features/resguardos/ResguardoCreateForm.module.css";

const initialSectionValues = {
  idEstadoResguardo: "1",
};

gsap.registerPlugin(useGSAP);

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
  span?: "full" | "half" | "third" | "quarter" | "twoThirds";
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
}

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
          "marca",
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
        completed: getCount(values, [
          "usuarioTitularId",
          "usuarioResguardaId",
          "usuarioAsignaId",
        ]),
        total: 3,
      };
    case "ubicacion":
      return {
        completed: getCount(values, ["telefono", "resguardo"]),
        total: 2,
      };
    case "control":
      return {
        completed: getCount(values, ["fechaAsignacion", "idEstadoResguardo"]),
        total: 2,
      };
    case "extras": {
      const hasNotes = Boolean(values.observaciones?.trim());
      const hasAccessories = details.some(
        (detail) => detail.accesorioId || detail.numeroSerie.trim(),
      );
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

function toDraftDetalles(
  detalles: DetalleItem[],
  accesorios: OptionItem[],
): PreviewAccesorioDraft[] {
  return detalles.map((detalle) => ({
    id: detalle.id,
    accesorioId: detalle.accesorioId,
    accesorioLabel: getOptionLabel(accesorios, detalle.accesorioId),
    numeroSerie: detalle.numeroSerie,
  }));
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
  const hydrated = useIsHydrated();
  const draft = usePreviewResguardoDraft();
  const formKey = hydrated && draft ? "draft-loaded" : "draft-empty";

  return (
    <ResguardoCreateFormContent
      key={formKey}
      {...props}
      initialDraft={hydrated ? draft : null}
    />
  );
}

function ResguardoCreateFormContent({
  sources,
  cancelHref = "/resguardos",
  initialDraft,
}: ResguardoCreateFormContentProps) {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement | null>(null);
  const [detalles, setDetalles] = useState<DetalleItem[]>(
    initialDraft?.detalles?.map((detalle) => ({
      id: detalle.id || nextDetailId(),
      accesorioId: detalle.accesorioId,
      numeroSerie: detalle.numeroSerie,
    })) ?? [],
  );
  const [openSection, setOpenSection] = useState<SectionKey>("equipo");
  const [formValues, setFormValues] = useState<Record<string, string>>({
    ...initialSectionValues,
    idInventario: initialDraft?.idInventario ?? "",
    marca: initialDraft?.marca ?? "",
    resguardo: initialDraft?.resguardo ?? "",
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
    usuarioAsignaId: initialDraft?.usuarioAsignaId ?? "",
  });
  const accesorios = sources.accesorios.options;
  const tiposBien = sources.tiposBien.options;
  const modelos = sources.modelos.options;
  const sistemasOperativos = sources.sistemasOperativos.options;
  const colores = sources.colores.options;
  const procesadores = sources.procesadores.options;
  const users = sources.usuarios.options;
  const estadoOptionsSource: SelectOptionsSource = {
    state: "ready",
    options: [
      { value: "1", label: "Activo" },
      { value: "2", label: "Devuelto" },
      { value: "3", label: "Cancelado" },
    ],
  };

  function updateField(name: string, value: string) {
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
    setDetalles((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
  }

  function addDetalle() {
    setOpenSection("extras");
    setDetalles((current) => [
      ...current,
      { id: nextDetailId(), accesorioId: "", numeroSerie: "" },
    ]);
  }

  function removeDetalle(id: string) {
    setDetalles((current) => current.filter((item) => item.id !== id));
  }

  function continueToPreview() {
    const draft: PreviewResguardoDraft = {
      idInventario: formValues.idInventario ?? "",
      marca: formValues.marca ?? "",
      resguardo: formValues.resguardo ?? "",
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
            { value: "1", label: "Activo" },
            { value: "2", label: "Devuelto" },
            { value: "3", label: "Cancelado" },
          ],
          formValues.idEstadoResguardo ?? "1",
        ) || "Activo",
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
      usuarioAsignaLabel: getOptionLabel(users, formValues.usuarioAsignaId),
      usuarioAsignaHelper:
        users.find((option) => option.value === formValues.usuarioAsignaId)?.helper ?? "",
      tipoBienId: formValues.tipoBienId ?? "",
      modeloId: formValues.modeloId ?? "",
      sistemaOperativoId: formValues.sistemaOperativoId ?? "",
      colorMaterialId: formValues.colorMaterialId ?? "",
      procesadorId: formValues.procesadorId ?? "",
      usuarioTitularId: formValues.usuarioTitularId ?? "",
      usuarioResguardaId: formValues.usuarioResguardaId ?? "",
      usuarioAsignaId: formValues.usuarioAsignaId ?? "",
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

  useGSAP(
    () => {
      if (!formRef.current) {
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(formRef.current.querySelectorAll("[data-motion-item]"), {
          autoAlpha: 1,
          clearProps: "all",
        });
        return;
      }

      const items = formRef.current.querySelectorAll("[data-motion-item]");
      if (!items.length) {
        return;
      }

      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          ease: "power2.out",
          stagger: 0.05,
          clearProps: "opacity,visibility,transform",
        },
      );
    },
    { scope: formRef },
  );

  return (
    <div ref={formRef} className={styles.form}>
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
            onChange={(event) => updateField("idInventario", event.target.value)}
          />
          <Field
            label="Marca"
            name="marca"
            value={formValues.marca ?? ""}
            span="third"
            onChange={(event) => updateField("marca", event.target.value)}
          />
          <SelectField
            label="Tipo de bien"
            name="tipoBienId"
            source={sources.tiposBien}
            value={formValues.tipoBienId ?? ""}
            span="third"
            onChange={(event) => updateField("tipoBienId", event.target.value)}
          />
          <SelectField
            label="Modelo"
            name="modeloId"
            source={sources.modelos}
            value={formValues.modeloId ?? ""}
            span="third"
            onChange={(event) => updateField("modeloId", event.target.value)}
          />
          <Field
            label="Numero de serie"
            name="numeroSerie"
            value={formValues.numeroSerie ?? ""}
            span="third"
            onChange={(event) => updateField("numeroSerie", event.target.value)}
          />
          <Field
            label="Folio de resguardo"
            name="resguardo"
            value={formValues.resguardo ?? ""}
            span="third"
            onChange={(event) => updateField("resguardo", event.target.value)}
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
            onChange={(event) => updateField("procesadorId", event.target.value)}
          />
          <SelectField
            label="Sistema operativo"
            name="sistemaOperativoId"
            source={sources.sistemasOperativos}
            value={formValues.sistemaOperativoId ?? ""}
            span="half"
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
            onChange={(event) => updateField("colorMaterialId", event.target.value)}
          />
          <Field
            label="IP"
            name="ip"
            value={formValues.ip ?? ""}
            span="quarter"
            placeholder="192.168.0.10"
            onChange={(event) => updateField("ip", event.target.value)}
          />
          <Field
            label="MAC"
            name="mac"
            value={formValues.mac ?? ""}
            span="quarter"
            placeholder="00:00:00:00:00:00"
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
            source={sources.usuarios}
            value={formValues.usuarioTitularId ?? ""}
            span="half"
            onChange={(event) => updateField("usuarioTitularId", event.target.value)}
          />
          <UserComboboxField
            label="Usuario que resguarda"
            name="usuarioResguardaId"
            source={sources.usuarios}
            value={formValues.usuarioResguardaId ?? ""}
            span="half"
            onChange={(event) =>
              updateField("usuarioResguardaId", event.target.value)
            }
          />
          <UserComboboxField
            label="Usuario que asigna"
            name="usuarioAsignaId"
            source={sources.usuarios}
            value={formValues.usuarioAsignaId ?? ""}
            span="half"
            onChange={(event) => updateField("usuarioAsignaId", event.target.value)}
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
            label="Referencia de area"
            name="resguardo"
            value={formValues.resguardo ?? ""}
            span="half"
            placeholder="Folio o referencia interna"
            onChange={(event) => updateField("resguardo", event.target.value)}
          />
          <Field
            label="Telefono de contacto"
            name="telefono"
            value={formValues.telefono ?? ""}
            span="half"
            placeholder="5551234567"
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
          <DateField
            label="Fecha de asignacion"
            name="fechaAsignacion"
            value={formValues.fechaAsignacion ?? ""}
            span="half"
            onChange={(event) => updateField("fechaAsignacion", event.target.value)}
          />
          <SelectField
            label="Estado"
            name="idEstadoResguardo"
            source={estadoOptionsSource}
            value={formValues.idEstadoResguardo ?? "1"}
            span="quarter"
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
          <span className={styles.label}>Observaciones</span>
          <textarea
            className={styles.textarea}
            name="observaciones"
            rows={4}
            value={formValues.observaciones ?? ""}
            placeholder="Notas relevantes del resguardo."
            onChange={(event) => updateField("observaciones", event.target.value)}
          />
        </label>

        <div className={styles.detailList}>
          {detalles.length ? (
            <>
              {detalles.map((detalle, index) => (
                <div key={detalle.id} className={styles.detailRow} data-motion-item>
                  <button
                    type="button"
                    className={styles.removeIconButton}
                    onClick={() => removeDetalle(detalle.id)}
                    aria-label={`Quitar accesorio ${index + 1}`}
                    title="Quitar accesorio"
                  >
                    <Trash2 size={16} strokeWidth={1.9} />
                  </button>
                  <SelectField
                    label={`Accesorio ${index + 1}`}
                    name={`detalle-accesorio-${index}`}
                    source={sources.accesorios}
                    value={detalle.accesorioId}
                    onChange={(event) =>
                      updateDetalle(detalle.id, "accesorioId", event.target.value)
                    }
                    span="half"
                  />
                  <Field
                    label="Serie del accesorio"
                    name={`detalle-serie-${index}`}
                    value={detalle.numeroSerie}
                    onChange={(event) =>
                      updateDetalle(detalle.id, "numeroSerie", event.target.value)
                    }
                    span="half"
                  />
                </div>
              ))}
            </>
          ) : (
            <div className={styles.emptyAccessoriesCard}>
              <p className={styles.emptyAccessories}>No se han agregado accesorios.</p>
            </div>
          )}

          <button
            type="button"
            className={styles.detailAddCard}
            onClick={addDetalle}
            data-motion-item
          >
            <span className={styles.detailAddIcon}>
              <Plus size={18} strokeWidth={2} />
            </span>
            <span className={styles.detailAddLabel}>Nuevo accesorio</span>
          </button>
        </div>
      </Section>

      <div className={styles.actions} data-motion-item>
        <Link href={cancelHref} className={styles.cancelLink}>
          Cancelar
        </Link>
        <button type="button" className={styles.primaryButton} onClick={continueToPreview}>
          Revisar resguardo
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
  span = "full",
  onChange,
}: BaseFieldProps) {
  return (
    <label className={`${styles.fieldBlock} ${getSpanClass(span)}`}>
      <span className={styles.label}>{label}</span>
      <input
        className={styles.input}
        name={name}
        placeholder={placeholder}
        onChange={onChange}
        {...(value !== undefined ? { value } : {})}
        {...(defaultValue !== undefined ? { defaultValue } : {})}
      />
    </label>
  );
}

function DateField({
  label,
  name,
  value,
  span = "full",
  onChange,
}: BaseFieldProps) {
  return (
    <label className={`${styles.fieldBlock} ${getSpanClass(span)}`}>
      <span className={styles.label}>{label}</span>
      <input
        className={styles.input}
        type="datetime-local"
        name={name}
        onChange={onChange}
        {...(value !== undefined ? { value } : {})}
      />
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
  defaultValue,
  span = "full",
  onChange,
}: SelectFieldProps) {
  const isUnavailable = source.state !== "ready";
  const placeholder =
    source.state === "error"
      ? "No disponible"
      : source.state === "empty"
        ? "Sin registros"
        : "Selecciona una opcion";

  return (
    <label className={`${styles.fieldBlock} ${getSpanClass(span)}`}>
      <span className={styles.label}>{label}</span>
      <select
        className={styles.select}
        name={name}
        disabled={isUnavailable}
        onChange={onChange}
        {...(value !== undefined ? { value } : {})}
        {...(defaultValue !== undefined ? { defaultValue } : {})}
      >
        <option value="">{placeholder}</option>
        {source.options.map((option) => (
          <option key={`${name}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

function UserComboboxField({
  label,
  name,
  source,
  value,
  span = "full",
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
      <span className={styles.label}>{label}</span>
      <div
        className={`${styles.combobox} ${isOpen ? styles.comboboxOpen : ""} ${
          isUnavailable ? styles.comboboxDisabled : ""
        }`}
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
