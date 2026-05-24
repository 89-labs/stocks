"use client";

import { usePathname } from "next/navigation";
import { Header, Footer, MobileBottomNav } from "@/components/layout/header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMinimalChrome =
    pathname?.startsWith("/dashboard") || pathname?.startsWith("/auth");

  if (isMinimalChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
