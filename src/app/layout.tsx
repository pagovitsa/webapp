import type { Metadata } from "next";
import Link from "next/link";
import { NavLink } from "@/shared/ui/nav-link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "webapp", template: "%s · webapp" },
  description: "Next.js App Router με δομή DDD",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <body>
        <header className="site-header">
          <div className="container site-header__inner">
            <Link href="/" className="brand">
              <span className="brand__mark" aria-hidden="true" />
              webapp
            </Link>
            <nav className="site-nav" aria-label="Κύρια πλοήγηση">
              <NavLink href="/">Αρχική</NavLink>
              <NavLink href="/orders">Παραγγελίες</NavLink>
            </nav>
          </div>
        </header>
        <main className="container site-main">{children}</main>
      </body>
    </html>
  );
}
