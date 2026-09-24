"use client";

import { useEffect, useRef, useState } from "react";

// Muestra una imagen de public/img. Si el archivo aun no existe, no rompe la
// pagina: la imagen queda oculta en vez de mostrar el icono de imagen rota.
export default function Logo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // La imagen pudo terminar de cargar antes de que React conectara onLoad.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={`${className ?? ""} ${loaded ? "" : "hidden"}`}
      onLoad={() => setLoaded(true)}
    />
  );
}
