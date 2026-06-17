import DefinitionList from "@/components/ui/DefinitionList";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import UserEmailForm from "@/features/usuarios/UserEmailForm";
import { getUsuarioById } from "@/lib/services/usuarios.service";
import { formatText } from "@/lib/utils/format";
import styles from "@/app/(workspace)/usuarios/[id]/page.module.css";

interface UsuarioDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UsuarioDetailPage({
  params,
}: UsuarioDetailPageProps) {
  const { id } = await params;
  const usuario = await getUsuarioById(id);

  return (
    <>
      <PageHeader
        eyebrow="Perfil de usuario"
        title={formatText(usuario.nombre, "Usuario sin nombre")}
        description="Detalle del usuario disponible para asignación de equipos y actualización de correo institucional."
      />

      <section className={styles.grid}>
        <Panel title="Identidad administrativa" description="Datos publicados por backend">
          <DefinitionList
            items={[
              { label: "Clave", value: formatText(usuario.neyemp) },
              { label: "Nombre", value: formatText(usuario.nombre) },
              { label: "Correo", value: formatText(usuario.email) },
              {
                label: "Adscripción",
                value: formatText(usuario.adscripcion?.desAds),
              },
              {
                label: "Puesto",
                value: formatText(usuario.puesto?.des_neccat),
              },
            ]}
          />
        </Panel>

        <Panel
          title="Actualizar correo"
          description="El endpoint Swagger admite actualización puntual del correo por clave de empleado."
        >
          <UserEmailForm
            neyemp={usuario.neyemp ?? ""}
            email={usuario.email ?? ""}
          />
        </Panel>
      </section>
    </>
  );
}
