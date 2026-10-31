import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthScreen } from "@/modules/users/presentation/components/auth-screen";
import type { AuthAppearance, AuthMode } from "@/modules/users/contracts";

const appearances: AuthAppearance[] = ["nucleus", "smart-save", "midnight"];
const modes: AuthMode[] = ["login", "register", "forgot-password", "reset-password"];
export const metadata: Metadata = { title: "Προεπισκοπήσεις ταυτοποίησης", robots: { index: false, follow: false } };
export function generateStaticParams() { return appearances.map(appearance => ({ appearance })); }

export default async function PreviewPage({ params }: { params: Promise<{ appearance: string }> }) {
  const requested = (await params).appearance;
  const appearance = appearances.find(value => value === requested);
  if (!appearance) notFound();
  return <div className="page">
    <header className="page-header">
      <h1>Προεπισκόπηση: {appearance}</h1>
      <p>Οι υποβολές είναι απενεργοποιημένες στην προεπισκόπηση.</p>
      <nav aria-label="Προεπισκοπήσεις εμφάνισης">{appearances.map(value => <p key={value}><Link href={`/users/previews/${value}`} aria-current={value === appearance ? "page" : undefined}>{value}</Link></p>)}</nav>
    </header>
    {modes.map(mode => <AuthScreen key={mode} mode={mode} appearance={appearance} token="preview-only" preview />)}
  </div>;
}
