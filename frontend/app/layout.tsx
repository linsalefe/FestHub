import type { Metadata } from "next";
import { DM_Sans, Quicksand } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Île Magique - Gestão de Festas",
  description: "Plataforma de gestão de orçamentos para decoração de festas infantis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${quicksand.variable}`}>
      <body className="font-[family-name:var(--font-dm-sans)] antialiased bg-[#FAFBFE] min-h-screen">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
