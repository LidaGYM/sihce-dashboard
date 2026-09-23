import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIHCE - Modulos Implementados",
  description: "Dashboard web de modulos SIHCE implementados por IPRESS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
