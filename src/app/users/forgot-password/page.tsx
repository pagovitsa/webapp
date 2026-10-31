import type { Metadata } from "next";
import { AuthForm } from "@/modules/users/presentation/components/auth-form";
import { Card } from "@/shared/ui/card";

export const metadata: Metadata = { title: "Ανάκτηση κωδικού" };
export default function ForgotPasswordPage() {
  return <div className="page"><h1>Ανάκτηση κωδικού</h1><Card><AuthForm mode="forgot-password" /></Card></div>;
}
