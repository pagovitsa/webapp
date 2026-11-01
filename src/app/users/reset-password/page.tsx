import { redirectToUsers } from "../auth-redirect";
import type { AuthEntryQuery } from "@/modules/users/contracts";
export default async function ResetPasswordAliasPage({ searchParams }: { searchParams: Promise<AuthEntryQuery> }) {
  redirectToUsers("reset-password", await searchParams);
}
