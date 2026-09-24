import Link from "next/link";
import BrandLayout from "@/components/BrandLayout";
import { SECTIONS } from "@/lib/sections";

const buttonClass =
  "flex min-h-[3.5rem] w-64 items-center justify-center rounded-md border border-gray-700 px-4 py-2 text-center text-white uppercase shadow-sm";

export default function Home() {
  return (
    <BrandLayout subtitle="Modulos SIHCE Implementados">
      <div className="px-4 py-8 sm:px-12">
        <h2 className="max-w-xl text-4xl font-medium leading-tight text-black">Modulos Implementados en el SIHCE</h2>
        <p className="mt-12 text-4xl font-medium text-gray-500">REGION ICA</p>

        <div className="mt-16 flex flex-col gap-6">
          <Link href="/modulos-general" className={`${buttonClass} bg-sihce-green hover:brightness-110`}>
            Modulos en General
          </Link>
          <div className="flex flex-wrap gap-6">
            {Object.entries(SECTIONS).map(([slug, s]) => (
              <Link key={slug} href={`/modulos/${slug}`} className={`${buttonClass} bg-sihce-button hover:brightness-110`}>
                {s.title}
              </Link>
            ))}
          </div>
        </div>

        <Link href="/settings" className="mt-12 inline-block text-xs text-gray-400 hover:text-gray-600">
          Configuracion / Cargar datos
        </Link>
      </div>
    </BrandLayout>
  );
}
