import Image from "next/image";

import LoginForm from "@/features/auth/LoginForm";
import styles from "@/app/login/page.module.css";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Image
          src="/img/logos.png"
          alt="Gobierno del Estado de México"
          width={495}
          height={92}
          className={styles.logos}
          priority
        />

        <div className={styles.heading}>
          <h1>Iniciar sesión</h1>
          <p>Ingresa tus credenciales institucionales para continuar.</p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
