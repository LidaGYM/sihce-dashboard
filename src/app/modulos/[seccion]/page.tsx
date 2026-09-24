import { notFound } from "next/navigation";
import ModulesView from "@/components/ModulesView";
import { SECTIONS } from "@/lib/sections";

export default function SeccionPage({ params }: { params: { seccion: string } }) {
  const section = SECTIONS[params.seccion];
  if (!section) notFound();
  return <ModulesView section={section} />;
}
