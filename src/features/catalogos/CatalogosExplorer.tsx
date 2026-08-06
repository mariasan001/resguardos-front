"use client";

import {
  Boxes,
  Check,
  Cpu,
  Keyboard,
  Layers,
  MonitorSmartphone,
  Palette,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import MotionItem from "@/components/ui/MotionItem";
import {
  createCatalogAction,
  deleteCatalogAction,
  updateCatalogAction,
  type CatalogGroupId,
} from "@/features/catalogos/actions";
import styles from "@/features/catalogos/CatalogosExplorer.module.css";

export type { CatalogGroupId };

export interface CatalogItem {
  id: string;
  label: string;
  marca?: string;
  marcaId?: string;
  modelo?: string;
}

export interface CatalogGroup {
  id: CatalogGroupId;
  label: string;
  description: string;
  singular: string;
  items: CatalogItem[];
}

const GROUP_ICONS: Record<CatalogGroupId, LucideIcon> = {
  tiposBien: Boxes,
  marcas: Tag,
  modelos: Layers,
  sistemasOperativos: MonitorSmartphone,
  colores: Palette,
  procesadores: Cpu,
  accesorios: Keyboard,
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function AccessoryForm({
  title,
  label,
  marcaId,
  modelo,
  brandItems,
  modelItems,
  pending,
  onLabelChange,
  onMarcaChange,
  onModeloChange,
  onSave,
  onCancel,
}: {
  title: string;
  label: string;
  marcaId: string;
  modelo: string;
  brandItems: CatalogItem[];
  modelItems: CatalogItem[];
  pending: boolean;
  onLabelChange: (value: string) => void;
  onMarcaChange: (value: string) => void;
  onModeloChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={styles.accessoryForm}>
      <div className={styles.accessoryFormHead}>
        <h4 className={styles.accessoryFormTitle}>{title}</h4>
        <div className={styles.accessoryFormActions}>
          <button
            type="button"
            className={styles.confirmButton}
            disabled={pending}
            onClick={onSave}
            aria-label="Guardar"
          >
            <Check size={15} strokeWidth={2.2} />
            Guardar
          </button>
          <button
            type="button"
            className={styles.cancelButton}
            disabled={pending}
            onClick={onCancel}
            aria-label="Cancelar"
          >
            <X size={15} strokeWidth={2.2} />
            Cancelar
          </button>
        </div>
      </div>

      <div className={styles.accessoryFormGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            Nombre <span className={styles.requiredMark} aria-hidden="true">*</span>
          </span>
          <input
            autoFocus
            required
            className={styles.fieldInput}
            value={label}
            placeholder="Ej. Monitor, teclado, mouse"
            onChange={(event) => onLabelChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSave();
              }
              if (event.key === "Escape") {
                onCancel();
              }
            }}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            Marca <span className={styles.requiredMark} aria-hidden="true">*</span>
          </span>
          <select
            required
            className={styles.fieldInput}
            value={marcaId}
            onChange={(event) => onMarcaChange(event.target.value)}
          >
            <option value="">Selecciona una marca</option>
            {brandItems.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            Modelo <span className={styles.requiredMark} aria-hidden="true">*</span>
          </span>
          <select
            required
            className={styles.fieldInput}
            value={modelo}
            onChange={(event) => onModeloChange(event.target.value)}
          >
            <option value="">Selecciona un modelo</option>
            {modelo &&
            !modelItems.some((model) => model.label === modelo) ? (
              <option value={modelo}>{modelo}</option>
            ) : null}
            {modelItems.map((model) => (
              <option key={model.id} value={model.label}>
                {model.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export default function CatalogosExplorer({ groups }: { groups: CatalogGroup[] }) {
  const [activeId, setActiveId] = useState<CatalogGroupId>(
    groups[0]?.id ?? "tiposBien",
  );
  const [query, setQuery] = useState("");
  const [itemsByGroup, setItemsByGroup] = useState<Record<string, CatalogItem[]>>(
    () => Object.fromEntries(groups.map((group) => [group.id, group.items])),
  );
  const [draftLabel, setDraftLabel] = useState<string | null>(null);
  const [draftMarcaId, setDraftMarcaId] = useState("");
  const [draftModelo, setDraftModelo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingMarcaId, setEditingMarcaId] = useState("");
  const [editingModelo, setEditingModelo] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const activeGroup =
    groups.find((group) => group.id === activeId) ?? groups[0] ?? null;
  const activeItems = useMemo(
    () => (activeGroup ? itemsByGroup[activeGroup.id] ?? [] : []),
    [activeGroup, itemsByGroup],
  );
  const supportsAccessoryMeta = activeGroup?.id === "accesorios";
  const brandItems = itemsByGroup.marcas ?? [];
  const modelItems = itemsByGroup.modelos ?? [];

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalize(query);

    if (!normalizedQuery) {
      return activeItems;
    }

    return activeItems.filter((item) =>
      normalize(`${item.label} ${item.marca ?? ""} ${item.modelo ?? ""}`).includes(
        normalizedQuery,
      ),
    );
  }, [activeItems, query]);

  if (!activeGroup) {
    return null;
  }

  const ActiveIcon = GROUP_ICONS[activeGroup.id];
  const isSearching = query.trim().length > 0;

  function resetEditors() {
    setDraftLabel(null);
    setDraftMarcaId("");
    setDraftModelo("");
    setEditingId(null);
    setEditingLabel("");
    setEditingMarcaId("");
    setEditingModelo("");
    setError("");
  }

  function findDuplicate(value: string, ignoreId?: string) {
    return activeItems.some(
      (item) =>
        item.id !== ignoreId && normalize(item.label) === normalize(value),
    );
  }

  function validateAccessoryFields(label: string, marcaId: string, modelo: string) {
    if (!label.trim()) {
      return "Escribe el nombre del accesorio.";
    }

    if (!marcaId.trim()) {
      return "Selecciona la marca del accesorio.";
    }

    if (!modelo.trim()) {
      return "Selecciona el modelo del accesorio.";
    }

    return null;
  }

  function resolveAccessoryItem(
    item: CatalogItem,
    marcaId: string,
    modelo: string,
  ): CatalogItem {
    if (activeGroup.id !== "accesorios") {
      return item;
    }

    const brand = brandItems.find(
      (entry) => entry.id === (item.marcaId || marcaId),
    );

    return {
      ...item,
      marcaId: item.marcaId || marcaId || undefined,
      marca: item.marca || brand?.label,
      modelo: item.modelo || modelo || undefined,
    };
  }

  function commitDraft() {
    if (supportsAccessoryMeta) {
      const accessoryError = validateAccessoryFields(
        draftLabel ?? "",
        draftMarcaId,
        draftModelo,
      );

      if (accessoryError) {
        setError(accessoryError);
        return;
      }
    } else if (!draftLabel?.trim()) {
      setError("Escribe un nombre para el nuevo elemento.");
      return;
    }

    if (findDuplicate(draftLabel ?? "")) {
      setError("Ese elemento ya existe en el catalogo.");
      return;
    }

    startTransition(async () => {
      const result = await createCatalogAction({
        groupId: activeGroup.id,
        label: draftLabel ?? "",
        marcaId: draftMarcaId,
        modelo: draftModelo,
      });

      if (!result.success || !result.item) {
        setError(result.message);
        return;
      }

      setItemsByGroup((current) => ({
        ...current,
        [activeGroup.id]: [
          ...(current[activeGroup.id] ?? []),
          resolveAccessoryItem(result.item!, draftMarcaId, draftModelo),
        ],
      }));
      resetEditors();
    });
  }

  function commitEdit() {
    if (!editingId) {
      return;
    }

    if (supportsAccessoryMeta) {
      const accessoryError = validateAccessoryFields(
        editingLabel,
        editingMarcaId,
        editingModelo,
      );

      if (accessoryError) {
        setError(accessoryError);
        return;
      }
    } else if (!editingLabel.trim()) {
      setError("El nombre no puede quedar vacio.");
      return;
    }

    if (findDuplicate(editingLabel, editingId)) {
      setError("Ese elemento ya existe en el catalogo.");
      return;
    }

    startTransition(async () => {
      const result = await updateCatalogAction({
        groupId: activeGroup.id,
        id: editingId,
        label: editingLabel,
        marcaId: editingMarcaId,
        modelo: editingModelo,
      });

      if (!result.success || !result.item) {
        setError(result.message);
        return;
      }

      setItemsByGroup((current) => ({
        ...current,
        [activeGroup.id]: (current[activeGroup.id] ?? []).map((item) =>
          item.id === editingId
            ? resolveAccessoryItem(result.item!, editingMarcaId, editingModelo)
            : item,
        ),
      }));
      resetEditors();
    });
  }

  function removeItem(id: string) {
    startTransition(async () => {
      const result = await deleteCatalogAction({
        groupId: activeGroup.id,
        id,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setItemsByGroup((current) => ({
        ...current,
        [activeGroup.id]: (current[activeGroup.id] ?? []).filter(
          (item) => item.id !== id,
        ),
      }));
      resetEditors();
    });
  }

  return (
    <MotionItem as="section" className={styles.layout} variant="scale">
      <nav className={styles.rail} aria-label="Catálogos disponibles">
        {groups.map((group) => {
          const Icon = GROUP_ICONS[group.id];
          const isActive = group.id === activeGroup.id;
          const count = (itemsByGroup[group.id] ?? []).length;

          return (
            <button
              key={group.id}
              type="button"
              className={styles.railItem}
              data-active={isActive || undefined}
              aria-current={isActive ? "true" : undefined}
              onClick={() => {
                setActiveId(group.id);
                setQuery("");
                resetEditors();
              }}
            >
              <span className={styles.railIcon}>
                <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <span className={styles.railLabel}>{group.label}</span>
              <span className={styles.railCount}>{count}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles.panel}>
        <header className={styles.panelHeader}>
          <div className={styles.panelHeading}>
            <span className={styles.panelIcon}>
              <ActiveIcon size={17} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <div className={styles.panelCopy}>
              <h3 className={styles.panelTitle}>{activeGroup.label}</h3>
              <p className={styles.panelDescription}>{activeGroup.description}</p>
            </div>
          </div>

          <div className={styles.panelTools}>
            <div className={styles.searchField}>
              <Search
                size={15}
                strokeWidth={2}
                className={styles.searchIcon}
                aria-hidden="true"
              />
              <input
                type="search"
                className={styles.searchInput}
                value={query}
                placeholder={
                  supportsAccessoryMeta
                    ? "Buscar por nombre, marca o modelo"
                    : "Buscar"
                }
                aria-label={`Buscar en ${activeGroup.label}`}
                onChange={(event) => setQuery(event.target.value)}
              />
              {isSearching ? (
                <button
                  type="button"
                  className={styles.searchClear}
                  onClick={() => setQuery("")}
                  aria-label="Limpiar búsqueda"
                >
                  <X size={13} strokeWidth={2.2} />
                </button>
              ) : null}
            </div>

            <button
              type="button"
              className={styles.addButton}
              disabled={pending}
              onClick={() => {
                resetEditors();
                setDraftLabel("");
              }}
            >
              <Plus size={15} strokeWidth={2.2} aria-hidden="true" />
              Nuevo {activeGroup.singular}
            </button>
          </div>
        </header>

        <div className={styles.panelMeta}>
          <span className={styles.metaCount}>
            {isSearching
              ? `${filteredItems.length} de ${activeItems.length} elementos`
              : `${activeItems.length} elemento${activeItems.length === 1 ? "" : "s"}`}
          </span>
        </div>

        {error ? <p className={styles.errorText}>{error}</p> : null}

        {draftLabel !== null ? (
          supportsAccessoryMeta ? (
            <AccessoryForm
              title={`Nuevo ${activeGroup.singular}`}
              label={draftLabel}
              marcaId={draftMarcaId}
              modelo={draftModelo}
              brandItems={brandItems}
              modelItems={modelItems}
              pending={pending}
              onLabelChange={(value) => {
                setDraftLabel(value);
                setError("");
              }}
              onMarcaChange={setDraftMarcaId}
              onModeloChange={setDraftModelo}
              onSave={commitDraft}
              onCancel={resetEditors}
            />
          ) : (
            <div className={styles.editorRow}>
              <input
                autoFocus
                className={styles.editorInput}
                value={draftLabel}
                placeholder={`Nombre del nuevo ${activeGroup.singular}`}
                onChange={(event) => {
                  setDraftLabel(event.target.value);
                  setError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitDraft();
                  }
                  if (event.key === "Escape") {
                    resetEditors();
                  }
                }}
              />
              <button
                type="button"
                className={styles.confirmButtonIcon}
                disabled={pending}
                onClick={commitDraft}
                aria-label="Guardar elemento"
              >
                <Check size={15} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                className={styles.cancelButtonIcon}
                disabled={pending}
                onClick={resetEditors}
                aria-label="Cancelar"
              >
                <X size={15} strokeWidth={2.2} />
              </button>
            </div>
          )
        ) : null}

        {filteredItems.length ? (
          <ul
            className={
              supportsAccessoryMeta ? styles.accessoryGrid : styles.itemGrid
            }
          >
            {filteredItems.map((item) =>
              editingId === item.id ? (
                <li
                  key={`${activeGroup.id}-edit-${item.id}`}
                  className={
                    supportsAccessoryMeta
                      ? styles.accessoryEditItem
                      : styles.editorStack
                  }
                >
                  {supportsAccessoryMeta ? (
                    <AccessoryForm
                      title={`Editar ${item.label}`}
                      label={editingLabel}
                      marcaId={editingMarcaId}
                      modelo={editingModelo}
                      brandItems={brandItems}
                      modelItems={modelItems}
                      pending={pending}
                      onLabelChange={(value) => {
                        setEditingLabel(value);
                        setError("");
                      }}
                      onMarcaChange={setEditingMarcaId}
                      onModeloChange={setEditingModelo}
                      onSave={commitEdit}
                      onCancel={resetEditors}
                    />
                  ) : (
                    <div className={styles.editorRow}>
                      <input
                        autoFocus
                        className={styles.editorInput}
                        value={editingLabel}
                        onChange={(event) => {
                          setEditingLabel(event.target.value);
                          setError("");
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            commitEdit();
                          }
                          if (event.key === "Escape") {
                            resetEditors();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className={styles.confirmButtonIcon}
                        disabled={pending}
                        onClick={commitEdit}
                        aria-label="Guardar cambios"
                      >
                        <Check size={15} strokeWidth={2.2} />
                      </button>
                      <button
                        type="button"
                        className={styles.cancelButtonIcon}
                        disabled={pending}
                        onClick={resetEditors}
                        aria-label="Cancelar"
                      >
                        <X size={15} strokeWidth={2.2} />
                      </button>
                    </div>
                  )}
                </li>
              ) : supportsAccessoryMeta ? (
                <li
                  key={`${activeGroup.id}-${item.id}`}
                  className={styles.accessoryCard}
                >
                  <div className={styles.accessoryCardBody}>
                    <span className={styles.accessoryName}>{item.label}</span>
                    <div className={styles.accessoryMetaRow}>
                      <span
                        className={styles.accessoryChip}
                        data-empty={!item.marca || undefined}
                      >
                        <Tag size={12} strokeWidth={2} aria-hidden="true" />
                        {item.marca || "Sin marca"}
                      </span>
                      <span
                        className={styles.accessoryChip}
                        data-empty={!item.modelo || undefined}
                      >
                        <Layers size={12} strokeWidth={2} aria-hidden="true" />
                        {item.modelo || "Sin modelo"}
                      </span>
                    </div>
                  </div>
                  <span className={styles.itemActions}>
                    <button
                      type="button"
                      className={styles.itemAction}
                      disabled={pending}
                      onClick={() => {
                        resetEditors();
                        setEditingId(item.id);
                        setEditingLabel(item.label);
                        setEditingMarcaId(item.marcaId ?? "");
                        setEditingModelo(item.modelo ?? "");
                      }}
                      aria-label={`Editar ${item.label}`}
                      title="Editar"
                    >
                      <Pencil size={14} strokeWidth={1.9} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.itemAction} ${styles.itemActionDanger}`}
                      disabled={pending}
                      onClick={() => removeItem(item.id)}
                      aria-label={`Eliminar ${item.label}`}
                      title="Eliminar"
                    >
                      <Trash2 size={14} strokeWidth={1.9} />
                    </button>
                  </span>
                </li>
              ) : (
                <li key={`${activeGroup.id}-${item.id}`} className={styles.item}>
                  <span className={styles.itemCopy}>
                    <span className={styles.itemLabel}>{item.label}</span>
                  </span>
                  <span className={styles.itemActions}>
                    <button
                      type="button"
                      className={styles.itemAction}
                      disabled={pending}
                      onClick={() => {
                        resetEditors();
                        setEditingId(item.id);
                        setEditingLabel(item.label);
                      }}
                      aria-label={`Editar ${item.label}`}
                      title="Editar"
                    >
                      <Pencil size={14} strokeWidth={1.9} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.itemAction} ${styles.itemActionDanger}`}
                      disabled={pending}
                      onClick={() => removeItem(item.id)}
                      aria-label={`Eliminar ${item.label}`}
                      title="Eliminar"
                    >
                      <Trash2 size={14} strokeWidth={1.9} />
                    </button>
                  </span>
                </li>
              ),
            )}
          </ul>
        ) : draftLabel === null ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>
              <Search size={18} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <p className={styles.emptyTitle}>
              {isSearching
                ? "Sin coincidencias"
                : "Este catálogo aún no tiene registros"}
            </p>
            <p className={styles.emptyText}>
              {isSearching
                ? `No encontramos resultados para "${query.trim()}".`
                : supportsAccessoryMeta
                  ? "Agrega el primer accesorio con su marca y modelo del catalogo."
                  : `Agrega el primer ${activeGroup.singular} con el boton de arriba.`}
            </p>
          </div>
        ) : null}
      </div>
    </MotionItem>
  );
}
