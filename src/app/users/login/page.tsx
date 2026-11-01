import { redirectToUsers } from "../auth-redirect";
import type { AuthEntryQuery } from "@/modules/users/contracts";
export default async function LoginAliasPage({ searchParams }: { searchParams: Promise<AuthEntryQuery> }) {
  redirectToUsers("login", await searchParams);
}
