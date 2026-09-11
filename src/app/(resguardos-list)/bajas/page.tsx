import ResguardoListPage from "@/features/resguardos/list";

interface BajasPageProps {
  searchParams: Promise<{
    q?: string;
    titular?: string;
    adscripcion?: string;
    fechaAsignacion?: string;
    fechaActualizacion?: string;
    page?: string;
    size?: string;
    sort?: string;
    dir?: string;
  }>;
}

export default function BajasPage({ searchParams }: BajasPageProps) {
  return <ResguardoListPage mode="bajas" searchParams={searchParams} />;
}
