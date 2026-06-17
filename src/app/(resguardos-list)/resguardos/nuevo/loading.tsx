import styles from "@/app/(resguardos-list)/resguardos/nuevo/page.module.css";

export default function NuevoResguardoLoading() {
  return (
    <section className={styles.page} aria-busy="true" aria-live="polite">
      <div className={styles.headerRow}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Nuevo resguardo</h1>
          <p className={styles.description}>Cargando catalogos y usuarios...</p>
        </div>
      </div>

      <section className={styles.formShell} />
    </section>
  );
}
