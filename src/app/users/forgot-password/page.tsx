import type { Metadata } from "next";
import { AuthScreen } from "@/modules/users/presentation/components/auth-screen";

export const metadata: Metadata = { title: "Ανάκτηση κωδικού" };
export default function ForgotPasswordPage() {
  return <AuthScreen mode="forgot-password" />;
}
