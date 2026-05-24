import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { AppShell } from "@/components/layout/app-shell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "NaijaStocks — Nigerian Stock Exchange Analysis",
    template: "%s | NaijaStocks",
  },
  description:
    "World-class stock analysis platform for the Nigerian Exchange Group (NGX). Browse, analyse, simulate trades, and get AI-powered predictions.",
  keywords: ["NGX", "Nigerian stocks", "stock market", "Nigeria", "investing"],
};

const themeInitScript = `
(function () {
  try {
    var root = document.documentElement;
    var stored = localStorage.getItem("naijastocks-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme =
      stored === "dark" || stored === "light"
        ? stored
        : prefersDark
          ? "dark"
          : "light";
    root.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
