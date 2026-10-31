import type { Metadata } from "next";
import { AuthScreen } from "@/modules/users/presentation/components/auth-screen";

export const metadata: Metadata = { title: "Σύνδεση" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ verified?: string; reset?: string; error?: string }> }) {
  const params = await searchParams;
  return <AuthScreen mode="login">
    {params.verified === "1" && !params.error && <p role="status">Το email επιβεβαιώθηκε. Μπορείς να συνδεθείς.</p>}
    {params.reset === "1" && <p role="status">Ο κωδικός άλλαξε. Συνδέσου με τον νέο κωδικό.</p>}
    {params.error && <p role="alert">Ο σύνδεσμος δεν είναι έγκυρος ή έχει λήξει.</p>}
  </AuthScreen>;
}
