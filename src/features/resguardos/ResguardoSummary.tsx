import { CalendarDays, Hash, Keyboard, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import styles from "@/features/resguardos/ResguardoSummary.module.css";

export type EstadoTone = "success" | "warning" | "danger" | "neutral";

export interface ResguardoSummaryItem {
  label: string;
  value: string;
  secondary?: string;
  wide?: boolean;
}

export interface ResguardoSummarySection {
  title: string;
  icon: ReactNode;
  items: ResguardoSummaryItem[];
  columns?: 1 | 2;
}

export interface ResguardoSummaryHero {
  inventario: string;
  estadoLabel: string;
  estadoTone: EstadoTone;
  equipo: string;
  titular: string;
  titularHelper?: string;
  fechaAsignacion: string;
}

export interface ResguardoAccessoryItem {
  accesorio: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
}

export interface ResguardoSummaryData {
  hero: ResguardoSummaryHero;
  sections: ResguardoSummarySection[];
  accessories: ResguardoAccessoryItem[];
}

interface ResguardoSummaryProps {
  hero?: ResguardoSummaryHero;
  sections: ResguardoSummarySection[];
  accessories?: ResguardoAccessoryItem[];
  footer?: ReactNode;
}

function SummaryHero({
  inventario,
  estadoLabel,
  estadoTone,
  equipo,
  titular,
  titularHelper,
  fechaAsignacion,
}: ResguardoSummaryHero) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroIdentity}>
        <span className={styles.heroLabel}>Folio de inventario</span>
        <p className={styles.heroFolio}>{inventario}</p>
        <span className={styles.heroBadge} data-tone={estadoTone}>
          <span className={styles.heroBadgeDot} aria-hidden="true" />
          {estadoLabel}
        </span>
      </div>

      <dl className={styles.heroFacts}>
        <div className={styles.heroFact}>
          <dt className={styles.heroFactLabel}>
            <Hash size={13} strokeWidth={2} aria-hidden="true" />
            Equipo
          </dt>
          <dd className={styles.heroFactValue}>{equipo}</dd>
        </div>

        <div className={styles.heroFact}>
          <dt className={styles.heroFactLabel}>
            <UserRound size={13} strokeWidth={2} aria-hidden="true" />
            Titular
          </dt>
          <dd className={styles.heroFactValue}>
            {titular}
            {titularHelper ? (
              <small className={styles.heroFactHelper}>{titularHelper}</small>
            ) : null}
          </dd>
        </div>

        <div className={styles.heroFact}>
          <dt className={styles.heroFactLabel}>
            <CalendarDays size={13} strokeWidth={2} aria-hidden="true" />
            Fecha de asignacion
          </dt>
          <dd className={styles.heroFactValue}>{fechaAsignacion}</dd>
        </div>
      </dl>
    </section>
  );
}

function SummarySection({
  title,
  icon,
  items,
  columns = 2,
}: ResguardoSummarySection) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>{icon}</span>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </header>

      <dl
        className={`${styles.definitionList} ${
          columns === 2 ? styles.definitionListTwoColumns : ""
        }`}
      >
        {items.map((item) => (
          <div
            key={`${title}-${item.label}`}
            className={styles.definitionRow}
            data-wide={item.wide || undefined}
          >
            <dt className={styles.definitionTerm}>{item.label}</dt>
            <dd className={styles.definitionValue}>
              <span>{item.value}</span>
              {item.secondary ? <small>{item.secondary}</small> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function AccessoriesSection({ items }: { items: ResguardoAccessoryItem[] }) {
  return (
    <section className={styles.accessories}>
      <header className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>
          <Keyboard size={16} strokeWidth={1.9} aria-hidden="true" />
        </span>
        <h2 className={styles.sectionTitle}>Accesorios</h2>
        <span className={styles.accessoriesCount}>
          {items.length} registrado{items.length === 1 ? "" : "s"}
        </span>
      </header>

      {items.length ? (
        <div className={styles.accessoriesTableWrap}>
          <table className={styles.accessoriesTable}>
            <thead>
              <tr>
                <th scope="col" className={styles.accessoriesIndexCol}>
                  #
                </th>
                <th scope="col">Accesorio</th>
                <th scope="col">Marca</th>
                <th scope="col">Modelo</th>
                <th scope="col">Numero de serie</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={`${item.accesorio}-${index}`}>
                  <td className={styles.accessoriesIndexCol}>
                    <span className={styles.accessoryIndex}>{index + 1}</span>
                  </td>
                  <td className={styles.accessoryName}>{item.accesorio}</td>
                  <td>{item.marca}</td>
                  <td>{item.modelo}</td>
                  <td className={styles.accessorySerial}>{item.numeroSerie}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.accessoriesEmpty}>
          Este resguardo no tiene accesorios registrados.
        </p>
      )}
    </section>
  );
}

export default function ResguardoSummary({
  hero,
  sections,
  accessories,
  footer,
}: ResguardoSummaryProps) {
  return (
    <div className={styles.page}>
      {hero ? <SummaryHero {...hero} /> : null}

      <div className={styles.sections}>
        {sections.map((section) => (
          <SummarySection key={section.title} {...section} />
        ))}
      </div>

      {accessories ? <AccessoriesSection items={accessories} /> : null}

      {footer}
    </div>
  );
}
