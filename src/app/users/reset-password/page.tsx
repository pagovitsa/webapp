import type { Metadata } from "next";
import { AuthScreen } from "@/modules/users/presentation/components/auth-screen";

export const metadata: Metadata = { title: "Νέος κωδικός", referrer: "no-referrer" };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return <AuthScreen mode="reset-password" token={token} showForm={Boolean(token && !error)}>
    {(!token || error) && <p role="alert">Ο σύνδεσμος δεν είναι έγκυρος ή έχει λήξει. Ζήτησε νέο σύνδεσμο ανάκτησης.</p>}
  </AuthScreen>;
}
