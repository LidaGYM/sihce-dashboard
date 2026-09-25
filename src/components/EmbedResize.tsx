"use client";

import { useEffect } from "react";

// Cuando el dashboard va dentro de un iframe, avisa a la pagina contenedora su
// alto real para que el iframe se ajuste sin barra de desplazamiento propia.
// La pagina contenedora debe escuchar este mensaje (ver README, "Embeber el dashboard").
export default function EmbedResize() {
  useEffect(() => {
    if (window.parent === window) return;
    let last = 0;
    const send = () => {
      const height = Math.ceil(document.body.scrollHeight);
      if (height === last) return;
      last = height;
      window.parent.postMessage({ type: "sihce-dashboard-height", height }, "*");
    };
    const observer = new ResizeObserver(send);
    observer.observe(document.body);
    send();
    return () => observer.disconnect();
  }, []);
  return null;
}
