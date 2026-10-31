import type { Metadata } from "next";
import { AuthScreen } from "@/modules/users/presentation/components/auth-screen";

export const metadata: Metadata = { title: "Εγγραφή" };
export default function RegisterPage() {
  return <AuthScreen mode="register" />;
}
