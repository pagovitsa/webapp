import { redirectToUsers } from "../auth-redirect";
import type { AuthEntryQuery } from "@/modules/users/contracts";
export default async function RegisterAliasPage({ searchParams }: { searchParams: Promise<AuthEntryQuery> }) {
  redirectToUsers("register", await searchParams);
}
