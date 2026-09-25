import type { Metadata } from "next";
import EmbedResize from "@/components/EmbedResize";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIHCE - Modulos Implementados",
  description: "Dashboard web de modulos SIHCE implementados por IPRESS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <EmbedResize />
      </body>
    </html>
  );
}
