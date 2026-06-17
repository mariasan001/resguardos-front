"use client";

import {
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  Cpu,
  NotebookPen,
  Package2,
  Plus,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import type { ChangeEventHandler, ReactNode } from "react";
import { useActionState, useState } from "react";

import FeedbackMessage from "@/components/ui/FeedbackMessage";
import { createResguardoAction } from "@/features/resguardos/actions";
import type {
  Accesorio,
  ActionResult,
  CatalogosBundle,
  OptionItem,
} from "@/lib/types/api";
import styles from "@/features/resguardos/ResguardoCreateForm.module.css";

const initialState: ActionResult = {
  success: false,
  message: "",
};

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
  users: OptionItem[];
  catalogos: CatalogosBundle;
  cancelHref?: string;
}

interface BaseFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  span?: "full" | "half" | "third" | "quarter" | "twoThirds";
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
}

function nextDetailId() {
  return globalThis.crypto?.randomUUID?.() ?? `detalle-${Date.now()}-${Math.random()}`;
}

function toCatalogOptions(
  items: Array<{
    id?: number;
    descTipoBien?: string;
    descModelo?: string;
    descSo?: string;
    descMaterial?: string;
    descProcesador?: string;
    descAccesorio?: string;
  }>,
) {
  return items.map((item) => ({
    value: String(item.id ?? ""),
    label:
      item.descTipoBien ??
      item.descModelo ??
      item.descSo ??
      item.descMaterial ??
      item.descProcesador ??
      item.descAccesorio ??
      "Sin descripcion",
  }));
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

      {isOpen ? (
        <div className={styles.sectionBody}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

export default function ResguardoCreateForm({
  users,
  catalogos,
  cancelHref = "/resguardos",
}: ResguardoCreateFormProps) {
  const [state, formAction, pending] = useActionState(
    createResguardoAction,
    initialState,
  );
  const [detalles, setDetalles] = useState<DetalleItem[]>([]);
  const [openSection, setOpenSection] = useState<SectionKey>("equipo");
  const [formValues, setFormValues] =
    useState<Record<string, string>>(initialSectionValues);

  const accesorios = toCatalogOptions(catalogos.accesorios as Accesorio[]);
  const tiposBien = toCatalogOptions(catalogos.tiposBien);
  const modelos = toCatalogOptions(catalogos.modelos);
  const sistemasOperativos = toCatalogOptions(catalogos.sistemasOperativos);
  const colores = toCatalogOptions(catalogos.colores);
  const procesadores = toCatalogOptions(catalogos.procesadores);

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

  const equipoStatus = getSectionStatus("equipo", formValues, detalles);
  const tecnicoStatus = getSectionStatus("tecnico", formValues, detalles);
  const responsableStatus = getSectionStatus("responsable", formValues, detalles);
  const ubicacionStatus = getSectionStatus("ubicacion", formValues, detalles);
  const controlStatus = getSectionStatus("control", formValues, detalles);
  const extrasStatus = getSectionStatus("extras", formValues, detalles);

  return (
    <form action={formAction} className={styles.form}>
      <input
        type="hidden"
        name="detallesPayload"
        value={JSON.stringify(
          detalles.map(({ accesorioId, numeroSerie }) => ({
            accesorioId,
            numeroSerie,
          })),
        )}
      />

      <div className={styles.topActions}>
        <Link href={cancelHref} className={styles.cancelLink}>
          Cancelar
        </Link>
        <button type="submit" className={styles.primaryButton} disabled={pending}>
          {pending ? "Guardando..." : "Guardar resguardo"}
        </button>
      </div>

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
            error={state.fieldErrors?.idInventario}
            required
            span="third"
            onChange={(event) => updateField("idInventario", event.target.value)}
          />
          <Field
            label="Marca"
            name="marca"
            error={state.fieldErrors?.marca}
            required
            span="third"
            onChange={(event) => updateField("marca", event.target.value)}
          />
          <SelectField
            label="Tipo de bien"
            name="tipoBienId"
            options={tiposBien}
            error={state.fieldErrors?.tipoBienId}
            required
            span="third"
            onChange={(event) => updateField("tipoBienId", event.target.value)}
          />
          <SelectField
            label="Modelo"
            name="modeloId"
            options={modelos}
            error={state.fieldErrors?.modeloId}
            required
            span="third"
            onChange={(event) => updateField("modeloId", event.target.value)}
          />
          <Field
            label="Numero de serie"
            name="numeroSerie"
            span="third"
            onChange={(event) => updateField("numeroSerie", event.target.value)}
          />
          <Field
            label="Folio de resguardo"
            name="resguardo"
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
            options={procesadores}
            error={state.fieldErrors?.procesadorId}
            required
            span="half"
            onChange={(event) => updateField("procesadorId", event.target.value)}
          />
          <SelectField
            label="Sistema operativo"
            name="sistemaOperativoId"
            options={sistemasOperativos}
            error={state.fieldErrors?.sistemaOperativoId}
            required
            span="half"
            onChange={(event) =>
              updateField("sistemaOperativoId", event.target.value)
            }
          />
          <SelectField
            label="Color o material"
            name="colorMaterialId"
            options={colores}
            error={state.fieldErrors?.colorMaterialId}
            required
            span="half"
            onChange={(event) => updateField("colorMaterialId", event.target.value)}
          />
          <Field
            label="IP"
            name="ip"
            span="quarter"
            placeholder="192.168.0.10"
            onChange={(event) => updateField("ip", event.target.value)}
          />
          <Field
            label="MAC"
            name="mac"
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
          <SelectField
            label="Usuario titular"
            name="usuarioTitularId"
            options={users}
            error={state.fieldErrors?.usuarioTitularId}
            required
            span="half"
            onChange={(event) => updateField("usuarioTitularId", event.target.value)}
          />
          <SelectField
            label="Usuario que resguarda"
            name="usuarioResguardaId"
            options={users}
            error={state.fieldErrors?.usuarioResguardaId}
            required
            span="half"
            onChange={(event) =>
              updateField("usuarioResguardaId", event.target.value)
            }
          />
          <SelectField
            label="Usuario que asigna"
            name="usuarioAsignaId"
            options={users}
            error={state.fieldErrors?.usuarioAsignaId}
            required
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
            span="half"
            placeholder="Folio o referencia interna"
            onChange={(event) => updateField("resguardo", event.target.value)}
          />
          <Field
            label="Telefono de contacto"
            name="telefono"
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
            error={state.fieldErrors?.fechaAsignacion}
            required
            span="half"
            onChange={(event) => updateField("fechaAsignacion", event.target.value)}
          />
          <SelectField
            label="Estado"
            name="idEstadoResguardo"
            options={[
              { value: "1", label: "Activo" },
              { value: "2", label: "Devuelto" },
              { value: "3", label: "Cancelado" },
            ]}
            defaultValue="1"
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
            placeholder="Notas relevantes del resguardo."
            onChange={(event) => updateField("observaciones", event.target.value)}
          />
        </label>

        <div className={styles.detailList}>
          {detalles.length ? (
            <>
            {detalles.map((detalle, index) => (
              <div key={detalle.id} className={styles.detailRow}>
                <SelectField
                  label={`Accesorio ${index + 1}`}
                  name={`detalle-accesorio-${index}`}
                  options={accesorios}
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
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeDetalle(detalle.id)}
                >
                  Quitar
                </button>
              </div>
            ))}
            </>
          ) : null}

          <button
            type="button"
            className={styles.detailAddCard}
            onClick={addDetalle}
          >
            <span className={styles.detailAddIcon}>
              <Plus size={18} strokeWidth={2} />
            </span>
            <span className={styles.detailAddLabel}>Nuevo accesorio</span>
          </button>
        </div>

        {!detalles.length ? (
          <p className={styles.emptyAccessories}>No se han agregado accesorios.</p>
        ) : null}
      </Section>

      {state.message ? (
        <FeedbackMessage
          tone={state.success ? "success" : "error"}
          message={
            state.success && state.createdId
              ? `${state.message} ID generado: ${state.createdId}.`
              : state.message
          }
        />
      ) : null}

      <div className={styles.actions}>
        <Link href={cancelHref} className={styles.cancelLink}>
          Cancelar
        </Link>
        <button type="submit" className={styles.primaryButton} disabled={pending}>
          {pending ? "Guardando..." : "Guardar resguardo"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  required,
  value,
  defaultValue,
  placeholder,
  span = "full",
  onChange,
}: BaseFieldProps) {
  return (
    <label className={`${styles.fieldBlock} ${getSpanClass(span)}`}>
      <span className={styles.label}>
        {label}
        {required ? <span className={styles.required}>*</span> : null}
      </span>
      <input
        className={styles.input}
        name={name}
        required={required}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onChange={onChange}
        {...(value !== undefined ? { value } : {})}
        {...(defaultValue !== undefined ? { defaultValue } : {})}
      />
      {error ? <span className={styles.error}>{error}</span> : null}
    </label>
  );
}

function DateField({
  label,
  name,
  error,
  required,
  span = "full",
  onChange,
}: BaseFieldProps) {
  return (
    <label className={`${styles.fieldBlock} ${getSpanClass(span)}`}>
      <span className={styles.label}>
        {label}
        {required ? <span className={styles.required}>*</span> : null}
      </span>
      <input
        className={styles.input}
        type="datetime-local"
        name={name}
        required={required}
        aria-invalid={Boolean(error)}
        onChange={onChange}
      />
      {error ? <span className={styles.error}>{error}</span> : null}
    </label>
  );
}

interface SelectFieldProps extends BaseFieldProps {
  options: OptionItem[];
}

function SelectField({
  label,
  name,
  options,
  error,
  required,
  value,
  defaultValue,
  span = "full",
  onChange,
}: SelectFieldProps) {
  return (
    <label className={`${styles.fieldBlock} ${getSpanClass(span)}`}>
      <span className={styles.label}>
        {label}
        {required ? <span className={styles.required}>*</span> : null}
      </span>
      <select
        className={styles.select}
        name={name}
        required={required}
        aria-invalid={Boolean(error)}
        onChange={onChange}
        {...(value !== undefined ? { value } : {})}
        {...(defaultValue !== undefined ? { defaultValue } : {})}
      >
        <option value="">Selecciona una opcion</option>
        {options.map((option) => (
          <option key={`${name}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className={styles.error}>{error}</span> : null}
    </label>
  );
}
