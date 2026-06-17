import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import AppProviders from "@/components/providers/AppProviders";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Resguardo de Cómputo",
  description:
    "Sistema institucional para gestión, control y consulta de resguardos de cómputo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={poppins.variable}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
