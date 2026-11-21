import type { Metadata } from "next";
import { connection } from "next/server";
import { getCurrentUser } from "@/modules/users/server";
import type { AuthEntryQuery } from "@/modules/users/contracts";
import { UsersEntry } from "@/modules/users/presentation/components/users-entry";
import { UserSession } from "@/modules/users/presentation/components/user-session";

export const metadata: Metadata = { title: "Χρήστες", referrer: "no-referrer", robots: { index: false, follow: false } };
export default async function UsersPage({ searchParams }: { searchParams: Promise<AuthEntryQuery> }) {
  await connection();
  // Στην αυτόνομη εγκατάσταση του Users, η σελίδα αναζητά τη συνεδρία μέσω της δημόσιας συνάρτησης του server.
  const user = await getCurrentUser();
  const query = await searchParams;
  if (query.form === "reset-password" || query.form === "forgot-password") return <UsersEntry query={query} signedIn={Boolean(user)} />;
  return user ? <UserSession /> : <UsersEntry query={query} />;
}
