import type { Metadata } from "next";
import { AuthForm } from "@/modules/users/presentation/components/auth-form";
import { Card } from "@/shared/ui/card";

export const metadata: Metadata = { title: "Νέος κωδικός", referrer: "no-referrer" };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return <div className="page"><h1>Νέος κωδικός</h1><Card>
    {(!token || error) ? <p role="alert">Ο σύνδεσμος δεν είναι έγκυρος ή έχει λήξει. Ζήτησε νέο σύνδεσμο ανάκτησης.</p> : <AuthForm mode="reset-password" token={token} />}
  </Card></div>;
}
