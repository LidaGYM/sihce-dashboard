import { notFound } from "next/navigation";
import BrandLayout from "@/components/BrandLayout";

const TITLES: Record<string, string> = {
  administrativos: "Modulos Administrativos",
  "consulta-externa": "Modulos de Consulta Externa",
  estrategias: "Modulos de Estrategias",
};

export default function SeccionPage({ params }: { params: { seccion: string } }) {
  const title = TITLES[params.seccion];
  if (!title) notFound();

  return (
    <BrandLayout subtitle={title} backHref="/">
      <div className="rounded-md bg-gray-50 p-10 text-center text-gray-500">Esta seccion esta en construccion.</div>
    </BrandLayout>
  );
}
