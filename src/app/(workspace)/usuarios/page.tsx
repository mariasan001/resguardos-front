import Link from "next/link";

import DataTable from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { getUsuarios } from "@/lib/services/usuarios.service";
import { formatText } from "@/lib/utils/format";
import styles from "@/app/(workspace)/usuarios/page.module.css";

export default async function UsuariosPage() {
  const usuarios = await getUsuarios();

  return (
    <>
      <PageHeader
        eyebrow="Usuarios"
        title="Directorio administrativo"
        description="Consulta de personal para asignación de resguardos y actualización de contacto previo al envío por correo."
      />

      <Panel
        title="Listado"
        description={`${usuarios.length} usuario(s) disponibles desde el backend.`}
      >
        <DataTable
          data={usuarios}
          keyExtractor={(item) => item.neyemp ?? item.nombre ?? item.email ?? "usuario"}
          emptyTitle="Sin usuarios"
          emptyDescription="El backend aún no devuelve usuarios. La arquitectura ya contempla este estado vacío."
          columns={[
            {
              key: "clave",
              header: "Clave",
              render: (item) => (
                <Link href={`/usuarios/${item.neyemp}`} className={styles.primaryLink}>
                  {formatText(item.neyemp)}
                </Link>
              ),
            },
            {
              key: "nombre",
              header: "Nombre",
              render: (item) => formatText(item.nombre),
            },
            {
              key: "email",
              header: "Correo",
              render: (item) => formatText(item.email),
            },
            {
              key: "adscripcion",
              header: "Adscripción",
              render: (item) => formatText(item.adscripcion?.desAds),
            },
            {
              key: "puesto",
              header: "Puesto",
              render: (item) => formatText(item.puesto?.des_neccat),
            },
          ]}
        />
      </Panel>
    </>
  );
}
