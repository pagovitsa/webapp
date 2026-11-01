import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "webapp", template: "%s · webapp" },
  description: "Εγγραφή, σύνδεση και διαχείριση του λογαριασμού σου στο webapp.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="el"><body>{children}</body></html>;
}
