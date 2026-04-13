import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FestHub - Gestao de Festas",
  description: "Plataforma de gestao de orcamentos para decoracao de festas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="font-[family-name:var(--font-dm-sans)] antialiased bg-[#FDFAF6] min-h-screen">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
