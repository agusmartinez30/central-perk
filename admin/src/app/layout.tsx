import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Café Central · Admin",
  description: "Panel de administración de Café Central.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
