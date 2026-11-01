"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { NavLink } from "@/shared/ui/nav-link";

export function SiteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/dashboards" || pathname.startsWith("/dashboards/")) return children;
  return <>
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="brand"><span className="brand__mark" aria-hidden="true" />webapp</Link>
        <nav className="site-nav" aria-label="Κύρια πλοήγηση">
          <NavLink href="/">Αρχική</NavLink>
          <NavLink href="/users">Λογαριασμός</NavLink>
          <NavLink href="/dashboards">Dashboard</NavLink>
        </nav>
      </div>
    </header>
    <main className="container site-main">{children}</main>
  </>;
}
