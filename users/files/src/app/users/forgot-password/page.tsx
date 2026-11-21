import { redirectToUsers } from "../auth-redirect";
import type { AuthEntryQuery } from "@/modules/users/contracts";
export default async function ForgotPasswordAliasPage({ searchParams }: { searchParams: Promise<AuthEntryQuery> }) {
  redirectToUsers("forgot-password", await searchParams);
}
