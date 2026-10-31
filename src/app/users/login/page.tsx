import type { Metadata } from "next";
import { AuthForm } from "@/modules/users/presentation/components/auth-form";
import { Card } from "@/shared/ui/card";

export const metadata: Metadata = { title: "Σύνδεση" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ verified?: string; reset?: string; error?: string }> }) {
  const params = await searchParams;
  return <div className="page"><h1>Σύνδεση</h1><Card>
    {params.verified === "1" && !params.error && <p role="status">Το email επιβεβαιώθηκε. Μπορείς να συνδεθείς.</p>}
    {params.reset === "1" && <p role="status">Ο κωδικός άλλαξε. Συνδέσου με τον νέο κωδικό.</p>}
    {params.error && <p role="alert">Ο σύνδεσμος δεν είναι έγκυρος ή έχει λήξει.</p>}
    <AuthForm mode="login" />
  </Card></div>;
}
