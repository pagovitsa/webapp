import type { Metadata } from "next";
import { AuthForm } from "@/modules/users/presentation/components/auth-form";
import { Card } from "@/shared/ui/card";

export const metadata: Metadata = { title: "Εγγραφή" };
export default function RegisterPage() {
  return <div className="page"><h1>Εγγραφή</h1><Card description="Το όνομα και το επώνυμο είναι προαιρετικά."><AuthForm mode="register" /></Card></div>;
}
