import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intua Guia | Tarot intuitivo e terapêutico",
  description: "Leituras de tarot para mais autoconhecimento, clareza e transformação.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* next/font/google via vinext gera @font-face com caminho absoluto
            de disco no Windows (bug do framework, não do CSS) — carregando
            direto do Google Fonts contornamos isso. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,600&family=Jost:wght@300;400&family=Marcellus&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
