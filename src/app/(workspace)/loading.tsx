import styles from "@/app/(workspace)/loading.module.css";

export default function Loading() {
  return (
    <div className={styles.page}>
      <div className={styles.hero} />
      <div className={styles.grid}>
        <div className={styles.card} />
        <div className={styles.card} />
        <div className={styles.card} />
      </div>
      <div className={styles.table} />
    </div>
  );
}
