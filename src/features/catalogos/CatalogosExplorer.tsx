"use client";

import { Plus, Search, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import MotionItem from "@/components/ui/MotionItem";
import { CatalogDraftEditor } from "@/features/catalogos/AccessoryForm";
import CatalogItemRow from "@/features/catalogos/CatalogItemRow";
import {
  createCatalogAction,
  deleteCatalogAction,
  updateCatalogAction,
  type CatalogGroupId,
} from "@/features/catalogos/actions";
import type {
  CatalogGroup,
  CatalogItem,
} from "@/features/catalogos/catalogos-types";
import { GROUP_ICONS, normalize } from "@/features/catalogos/catalogos-utils";
import styles from "@/features/catalogos/CatalogosExplorer.module.css";

export type {
  CatalogGroup,
  CatalogGroupId,
  CatalogItem,
} from "@/features/catalogos/catalogos-types";

export default function CatalogosExplorer({ groups }: { groups: CatalogGroup[] }) {
  const [activeId, setActiveId] = useState<CatalogGroupId>(
    groups[0]?.id ?? "tiposBien",
  );
  const [query, setQuery] = useState("");
  const [itemsByGroup, setItemsByGroup] = useState<Record<string, CatalogItem[]>>(
    () => Object.fromEntries(groups.map((group) => [group.id, group.items])),
  );
  const [draftLabel, setDraftLabel] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const activeGroup =
    groups.find((group) => group.id === activeId) ?? groups[0] ?? null;
  const activeItems = useMemo(
    () => (activeGroup ? itemsByGroup[activeGroup.id] ?? [] : []),
    [activeGroup, itemsByGroup],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalize(query);

    if (!normalizedQuery) {
      return activeItems;
    }

    return activeItems.filter((item) =>
      normalize(item.label).includes(normalizedQuery),
    );
  }, [activeItems, query]);

  if (!activeGroup) {
    return null;
  }

  const ActiveIcon = GROUP_ICONS[activeGroup.id];
  const isSearching = query.trim().length > 0;

  function resetEditors() {
    setDraftLabel(null);
    setEditingId(null);
    setEditingLabel("");
    setError("");
  }

  function findDuplicate(value: string, ignoreId?: string) {
    return activeItems.some(
      (item) =>
        item.id !== ignoreId && normalize(item.label) === normalize(value),
    );
  }

  function commitDraft() {
    if (!draftLabel?.trim()) {
      setError("Escribe un nombre para el nuevo elemento.");
      return;
    }

    if (findDuplicate(draftLabel)) {
      setError("Ese elemento ya existe en el catálogo.");
      return;
    }

    startTransition(async () => {
      const result = await createCatalogAction({
        groupId: activeGroup.id,
        label: draftLabel,
      });

      if (!result.success || !result.item) {
        setError(result.message);
        return;
      }

      setItemsByGroup((current) => ({
        ...current,
        [activeGroup.id]: [...(current[activeGroup.id] ?? []), result.item!],
      }));
      resetEditors();
    });
  }

  function commitEdit() {
    if (!editingId) {
      return;
    }

    if (!editingLabel.trim()) {
      setError("El nombre no puede quedar vacío.");
      return;
    }

    if (findDuplicate(editingLabel, editingId)) {
      setError("Ese elemento ya existe en el catálogo.");
      return;
    }

    startTransition(async () => {
      const result = await updateCatalogAction({
        groupId: activeGroup.id,
        id: editingId,
        label: editingLabel,
      });

      if (!result.success || !result.item) {
        setError(result.message);
        return;
      }

      setItemsByGroup((current) => ({
        ...current,
        [activeGroup.id]: (current[activeGroup.id] ?? []).map((item) =>
          item.id === editingId ? result.item! : item,
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
        </header>

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
              placeholder="Buscar"
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

        <div className={styles.panelMeta}>
          <span className={styles.metaCount}>
            {isSearching
              ? `${filteredItems.length} de ${activeItems.length} elementos`
              : `${activeItems.length} elemento${activeItems.length === 1 ? "" : "s"}`}
          </span>
        </div>

        {error ? <p className={styles.errorText}>{error}</p> : null}

        {draftLabel !== null ? (
          <CatalogDraftEditor
            singular={activeGroup.singular}
            label={draftLabel}
            pending={pending}
            onLabelChange={(value) => {
              setDraftLabel(value);
              setError("");
            }}
            onSave={commitDraft}
            onCancel={resetEditors}
          />
        ) : null}

        {filteredItems.length ? (
          <ul className={styles.itemGrid}>
            {filteredItems.map((item) => (
              <CatalogItemRow
                key={`${activeGroup.id}-${item.id}`}
                item={item}
                isEditing={editingId === item.id}
                editingLabel={editingLabel}
                pending={pending}
                onEditingLabelChange={(value) => {
                  setEditingLabel(value);
                  setError("");
                }}
                onSave={commitEdit}
                onCancel={resetEditors}
                onStartEdit={(entry) => {
                  resetEditors();
                  setEditingId(entry.id);
                  setEditingLabel(entry.label);
                }}
                onRemove={removeItem}
              />
            ))}
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
                : `Agrega el primer ${activeGroup.singular} con el botón de arriba.`}
            </p>
          </div>
        ) : null}
      </div>
    </MotionItem>
  );
}
