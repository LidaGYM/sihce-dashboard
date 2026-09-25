import Link from "next/link";
import Logo from "./Logo";

export const INSTITUTION_LOGOS = [
  { src: "/img/minsa.png", alt: "Ministerio de Salud", className: "h-9" },
  { src: "/img/gore-ica.png", alt: "Gobierno Regional de Ica", className: "h-10" },
  { src: "/img/escudo.png", alt: "Escudo", className: "h-10" },
  { src: "/img/emblema.png", alt: "Emblema", className: "h-10" },
];

function InstitutionLogos({ size = "" }: { size?: string }) {
  return (
    <div className={`flex items-center gap-3 ${size}`}>
      {INSTITUTION_LOGOS.map((l) => (
        <Logo key={l.src} {...l} />
      ))}
    </div>
  );
}

interface Props {
  subtitle: string; // segunda linea del banner, ej. "DETALLE DE MODULOS SIHCE IMPLEMENTADOS"
  backHref?: string;
  children: React.ReactNode;
}

export default function BrandLayout({ subtitle, backHref, children }: Props) {
  return (
    // Pensado para ir embebido (iframe) en otra web: ocupa todo el ancho disponible,
    // sin cabecera propia ni margenes externos.
    <div className="min-h-screen bg-white px-2 py-3 sm:px-4">
      <h1 className="pb-3 text-center text-xl font-bold text-sihce-title sm:text-3xl">
        Modulos SIHCE Implementados
      </h1>

      <div className="w-full">
        <div className="flex h-3">
          <div className="flex-[1] bg-sihce-green" />
          <div className="flex-[2] bg-sihce-yellow" />
          <div className="flex-[1] bg-sihce-green" />
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-b-lg px-2 py-3 shadow-md">
          <InstitutionLogos />
          <div className="flex-1 text-center text-base font-medium uppercase leading-snug text-gray-800 sm:text-xl">
            <div>SIHCE-MINSA Primer Nivel de Atención - Región Ica</div>
            <div>{subtitle}</div>
          </div>
          <div className="flex items-center gap-4">
            {backHref && (
              <Link
                href={backHref}
                aria-label="Volver"
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-700 text-xl text-gray-700 hover:bg-gray-100"
              >
                ←
              </Link>
            )}
            <Logo src="/img/icatec.png" alt="ICATEC" className="h-9" />
          </div>
        </div>

        {children}

        <div className="mt-4 flex justify-end">
          <Logo src="/img/sihce.png" alt="SIHCE del MINSA" className="h-14" />
        </div>
      </div>
    </div>
  );
}
