import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { CaseProvider } from "@/context/CaseContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NISUP — A safe voice to talk to",
  description:
    "NISUP is a voice-first, trauma-informed assistant for people affected by human trafficking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        {/* Material Symbols icon font — used across the Stitch screens */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-background">
        {/* Language + conversation/case state live in React context (never localStorage for case data). */}
        <LanguageProvider>
          <CaseProvider>{children}</CaseProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
